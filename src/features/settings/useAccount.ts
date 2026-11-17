import { useHistory } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import * as authClient from '../auth/authClient';
import { useSubmission } from '../../lib/useSubmission';

/**
 * Account-management logic for Settings: change password, delete account, sign
 * out. One Submission owns busy/error/message across the three actions;
 * sign-out and delete route home once their action succeeds.
 */
export function useAccount() {
  const { email, signOut, refresh } = useAuth();
  const history = useHistory();
  const { run, busy, error, message } = useSubmission();

  const goHome = (ok: boolean) => ok && history.replace('/home');

  return {
    email,
    busy,
    error,
    message,
    changePassword: (oldP: string, newP: string) =>
      run(() => authClient.changePassword(oldP, newP), {
        fallback: 'Something went wrong.',
        message: 'Password updated.',
      }),
    deleteAccount: () =>
      run(() => authClient.deleteAccount(), {
        fallback: 'Something went wrong.',
        message: 'Account deleted.',
      }).then(goHome),
    signOut: () =>
      run(
        async () => {
          await signOut();
          await refresh();
        },
        { fallback: 'Something went wrong.', message: 'Signed out.' },
      ).then(goHome),
  };
}
