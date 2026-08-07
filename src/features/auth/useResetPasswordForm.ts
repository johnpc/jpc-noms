import { useCallback, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from './useAuth';

type Phase = 'request' | 'confirm';

/** Form state + actions for the two-step forgot-password flow (email, then code + new password). */
export function useResetPasswordForm() {
  const { resetPassword, confirmResetPassword, signIn } = useAuth();
  const history = useHistory();
  const [phase, setPhase] = useState<Phase>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submitEmail = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      await resetPassword(email);
      setPhase('confirm');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send a reset code.');
    } finally {
      setBusy(false);
    }
  }, [email, resetPassword]);

  const submitReset = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      await confirmResetPassword(email, code, password);
      await signIn(email, password); // land signed in, like sign-up's finish()
      history.replace('/home');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reset your password.');
    } finally {
      setBusy(false);
    }
  }, [email, code, password, confirmResetPassword, signIn, history]);

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
