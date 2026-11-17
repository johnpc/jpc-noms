import { useCallback, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useSubmission } from '../../lib/useSubmission';

// @state-machine reset-password-wizard

/** request (email) → confirm (code + new password) → signed in. */
type Phase = 'request' | 'confirm';

/** Form state + actions for the two-step forgot-password flow (email, then code + new password). */
export function useResetPasswordForm() {
  const { resetPassword, confirmResetPassword, signIn } = useAuth();
  const history = useHistory();
  const [phase, setPhase] = useState<Phase>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const { run, busy, error } = useSubmission();

  const submitEmail = useCallback(async () => {
    const ok = await run(() => resetPassword(email), { fallback: 'Could not send a reset code.' });
    if (ok) setPhase('confirm');
  }, [email, resetPassword, run]);

  const submitReset = useCallback(async () => {
    const ok = await run(
      async () => {
        await confirmResetPassword(email, code, password);
        await signIn(email, password); // land signed in, like sign-up's finish()
      },
      { fallback: 'Could not reset your password.' },
    );
    if (ok) history.replace('/home');
  }, [email, code, password, confirmResetPassword, signIn, history, run]);

  return {
    phase,
    email,
    setEmail,
    code,
    setCode,
    password,
    setPassword,
    error,
    busy,
    submitEmail,
    submitReset,
  };
}
