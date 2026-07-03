import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import * as authClient from '../auth/authClient';

/**
 * Account-management logic for Settings: change password, delete account, sign
 * out. Each action tracks its own busy/error; sign-out and delete route home
 * and refresh the auth state.
 */
export function useAccount() {
  const { email, signOut, refresh } = useAuth();
  const history = useHistory();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>, ok: string, done?: () => void) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await fn();
      setMessage(ok);
      done?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return {
    email,
    busy,
    error,
    message,
    changePassword: (oldP: string, newP: string) =>
      run(() => authClient.changePassword(oldP, newP), 'Password updated.'),
    deleteAccount: () =>
      run(
        () => authClient.deleteAccount(),
        'Account deleted.',
        () => history.replace('/home'),
      ),
    signOut: () =>
      run(
        async () => {
          await signOut();
          await refresh();
        },
        'Signed out.',
        () => history.replace('/home'),
      ),
  };
}
