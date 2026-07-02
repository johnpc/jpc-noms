import { useCallback, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from './useAuth';

type Phase = 'collect' | 'confirm';

/** Form state + actions for the two-step Cognito sign-up (details, then code). */
export function useSignUpForm() {
  const { signUp, confirmSignUp, signIn } = useAuth();
  const history = useHistory();
  const [phase, setPhase] = useState<Phase>('collect');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const finish = useCallback(async () => {
    await signIn(email, password);
    history.replace('/noms');
  }, [email, password, signIn, history]);

  const submitDetails = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const { needsConfirmation } = await signUp(email, password);
      if (needsConfirmation) setPhase('confirm');
      else await finish();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-up failed.');
    } finally {
      setBusy(false);
    }
  }, [email, password, signUp, finish]);

  const submitCode = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      await confirmSignUp(email, code);
      await finish();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Confirmation failed.');
    } finally {
      setBusy(false);
    }
  }, [email, code, confirmSignUp, finish]);

  return {
    phase,
    email,
    setEmail,
    password,
    setPassword,
    code,
    setCode,
    error,
    busy,
    submitDetails,
    submitCode,
  };
}
