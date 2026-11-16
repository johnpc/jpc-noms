import { useCallback, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useSubmission } from '../../lib/useSubmission';

/** Form state + action for email/password sign-in. */
export function useSignInForm() {
  const { signIn } = useAuth();
  const history = useHistory();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { run, busy, error } = useSubmission();

  const submit = useCallback(async () => {
    const ok = await run(() => signIn(email, password), { fallback: 'Sign-in failed.' });
    if (ok) history.replace('/home'); // land on the main nav, not the noms history list
  }, [email, password, signIn, history, run]);

  return { email, setEmail, password, setPassword, error, busy, submit };
}
