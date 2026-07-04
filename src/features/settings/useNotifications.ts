import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../auth/useAuth';
import {
  pushStatus,
  enablePush,
  disablePush,
  isOptedOut,
  lastPushError,
} from '../push/registerPush';

/** UI state for the notifications control. `on`/`off` both require iOS-granted;
 * `off` is an in-app opt-out (token removed) while iOS still allows push. */
export type NotifState = 'on' | 'off' | 'prompt' | 'denied' | 'web';

/**
 * Settings control for push. Combines the iOS permission with the in-app
 * opt-out flag so the UI can offer Turn on / Turn off / Enable / Open iOS
 * Settings appropriately. iOS permission can only be revoked in iOS Settings,
 * so in-app "off" removes this device's token (see disablePush).
 */
export function useNotifications() {
  const { sub } = useAuth();
  const [state, setState] = useState<NotifState>('web');
  const [working, setWorking] = useState(false);

  const refresh = useCallback(async () => {
    const perm = await pushStatus();
    if (perm === 'granted') setState(isOptedOut() ? 'off' : 'on');
    else setState(perm); // 'prompt' | 'denied' | 'web'
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const enable = useCallback(async () => {
    if (!sub) return;
    setWorking(true);
    try {
      await enablePush(sub);
    } finally {
      setWorking(false);
      await refresh();
    }
  }, [sub, refresh]);

  const disable = useCallback(async () => {
    setWorking(true);
    try {
      await disablePush();
    } finally {
      setWorking(false);
      await refresh();
    }
  }, [refresh]);

  // iOS maps the `app-settings:` URL to this app's Settings pane. No-op on web.
  const openIosSettings = () => window.open('app-settings:', '_blank');

  return { state, working, enable, disable, openIosSettings, lastError: lastPushError() };
}
