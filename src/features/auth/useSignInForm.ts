import { useCallback, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from './useAuth';

/** Form state + action for email/password sign-in. */
export function useSignInForm() {
  const { signIn } = useAuth();
  const history = useHistory();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      await signIn(email, password);
      history.replace('/home'); // land on the main nav, not the noms history list
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  }, [email, password, signIn, history]);

  return { email, setEmail, password, setPassword, error, busy, submit };
}
