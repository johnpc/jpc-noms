import { useEffect, useRef } from 'react';
import { useAuth } from '../auth/useAuth';
import { enablePush, isOptedOut } from './registerPush';

/**
 * Registers this device for push once, when the user is signed in. Runs from
 * the app shell. No-op on web / when signed out / when the user turned push OFF
 * in-app (isOptedOut) — otherwise a sign-in would silently re-enable it.
 * Guarded so it fires a single time per session.
 */
export function usePushRegistration(): void {
  const { status, sub } = useAuth();
  const done = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated' || !sub || done.current || isOptedOut()) return;
    done.current = true;
    void enablePush(sub);
  }, [status, sub]);
}
