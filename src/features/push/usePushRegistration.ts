import { useEffect } from 'react';
import { useAuth } from '../auth/useAuth';
import { enablePush, isOptedOut } from './registerPush';
import { getPushState } from './pushStore';

/**
 * Registers this device for push when the user is signed in. Runs from the app
 * shell. No-op on web / when signed out / when the user turned push OFF in-app
 * (isOptedOut) — otherwise a sign-in would silently re-enable it. The
 * PushRegistration machine is the once-per-session guard: auto-start only
 * from `idle`, so a finished or failed flow is never re-kicked by a re-render.
 */
export function usePushRegistration(): void {
  const { status, sub } = useAuth();

  useEffect(() => {
    if (status !== 'authenticated' || !sub || isOptedOut()) return;
    if (getPushState().kind !== 'idle') return;
    void enablePush(sub);
  }, [status, sub]);
}
