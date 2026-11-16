import { useEffect, useState, useCallback, useSyncExternalStore } from 'react';
import { useAuth } from '../auth/useAuth';
import {
  pushStatus,
  enablePush,
  disablePush,
  isOptedOut,
  lastPushError,
  type PushStatus,
} from '../push/registerPush';
import { getPushState, subscribePush } from '../push/pushStore';
import { isPushWorking, pushFailure, type PushRegistration } from '../push/pushMachine';

// @state-machine notifications-control

/** UI state for the notifications control. `on`/`off` both require iOS-granted;
 * `off` is an in-app opt-out (token removed) while iOS still allows push. */
export type NotifState = 'on' | 'off' | 'prompt' | 'denied' | 'web';

/** Pure: the iOS permission × the in-app opt-out flag. */
export function notifState(permission: PushStatus, optedOut: boolean): NotifState {
  if (permission !== 'granted') return permission;
  return optedOut ? 'off' : 'on';
}

/** Pure: what the Register button says while the machine is mid-flow. */
export function registrationLabel(r: PushRegistration): string {
  switch (r.kind) {
    case 'requesting':
      return 'Asking permission…';
    case 'awaiting-token':
      return 'Waiting for Apple…';
    case 'saving':
      return 'Saving this device…';
    default:
      return 'Register this device';
  }
}

/**
 * Settings control for push. Combines the iOS permission with the in-app
 * opt-out flag so the UI can offer Turn on / Turn off / Enable / Open iOS
 * Settings appropriately, and subscribes to the live PushRegistration machine
 * so "Registering…" means the token really is still in flight — no sleep.
 */
export function useNotifications() {
  const { sub } = useAuth();
  const [permission, setPermission] = useState<PushStatus>('web');
  const [optedOut, setOptedOut] = useState(isOptedOut);
  const registration = useSyncExternalStore(subscribePush, getPushState, getPushState);

  const refresh = useCallback(async () => {
    setPermission(await pushStatus());
    setOptedOut(isOptedOut());
  }, []);

  // Re-read the permission whenever the registration machine moves (a grant
  // or refusal lands as a phase change) and on mount.
  useEffect(() => {
    void refresh();
  }, [refresh, registration.kind]);

  const enable = useCallback(async () => {
    if (!sub) return;
    await enablePush(sub);
    await refresh();
  }, [sub, refresh]);

  const disable = useCallback(async () => {
    await disablePush();
    await refresh();
  }, [refresh]);

  // iOS maps the `app-settings:` URL to this app's Settings pane. No-op on web.
  const openIosSettings = () => window.open('app-settings:', '_blank');

  return {
    state: notifState(permission, optedOut),
    working: isPushWorking(registration),
    registerLabel: registrationLabel(registration),
    lastError: pushFailure(registration) || lastPushError(),
    enable,
    disable,
    openIosSettings,
  };
}
