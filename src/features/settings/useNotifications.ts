import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../auth/useAuth';
import { pushStatus, enablePush, type PushStatus } from '../push/registerPush';

/**
 * Settings control for push: reports the current permission and lets the user
 * enable it (fires the iOS prompt + registers the device). When iOS has blocked
 * push (`denied`), the app can't re-prompt — the UI links to iOS Settings via
 * `openIosSettings`. Loads the status on mount and re-checks after enabling.
 */
export function useNotifications() {
  const { sub } = useAuth();
  const [status, setStatus] = useState<PushStatus>('web');
  const [working, setWorking] = useState(false);

  useEffect(() => {
    void pushStatus().then(setStatus);
  }, []);

  const enable = useCallback(async () => {
    if (!sub) return;
    setWorking(true);
    try {
      setStatus(await enablePush(sub));
    } finally {
      setWorking(false);
    }
  }, [sub]);

  // iOS maps the `app-settings:` URL to this app's Settings pane. No-op on web.
  const openIosSettings = () => window.open('app-settings:', '_blank');

  return { status, working, enable, openIosSettings };
}
