import { useCallback, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useSubmission } from '../../lib/useSubmission';

// @state-machine sign-up-wizard

/** collect → confirm (only when Cognito wants an emailed code) → signed in. */
type Phase = 'collect' | 'confirm';

/** Form state + actions for the two-step Cognito sign-up (details, then code). */
export function useSignUpForm() {
  const { signUp, confirmSignUp, signIn } = useAuth();
  const history = useHistory();
  const [phase, setPhase] = useState<Phase>('collect');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const { run, busy, error } = useSubmission();

  const finish = useCallback(async () => {
    await signIn(email, password);
    history.replace('/noms');
  }, [email, password, signIn, history]);

  const submitDetails = useCallback(
    () =>
      run(
        async () => {
          const { needsConfirmation } = await signUp(email, password);
          if (needsConfirmation) setPhase('confirm');
          else await finish();
        },
        { fallback: 'Sign-up failed.' },
      ),
    [email, password, signUp, finish, run],
  );

  const submitCode = useCallback(
    () =>
      run(
        async () => {
          await confirmSignUp(email, code);
          await finish();
        },
        { fallback: 'Confirmation failed.' },
      ),
    [email, code, confirmSignUp, finish, run],
  );

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
