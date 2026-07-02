import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import * as authClient from './authClient';
import type { AuthState, SignUpResult } from './types';

/** Provides Cognito session state + auth actions to the tree via AuthContext. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading', email: null });

  const refresh = useCallback(async () => {
    const email = await authClient.currentEmail();
    setState({ status: email ? 'authenticated' : 'unauthenticated', email });
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      await authClient.signIn(email, password);
      await refresh();
    },
    [refresh],
  );

  const signUp = useCallback(
    (email: string, password: string): Promise<SignUpResult> => authClient.signUp(email, password),
    [],
  );

  const confirmSignUp = useCallback(async (email: string, code: string) => {
    await authClient.confirmSignUp(email, code);
  }, []);

  const signOut = useCallback(async () => {
    await authClient.signOut();
    setState({ status: 'unauthenticated', email: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signUp, confirmSignUp, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}
