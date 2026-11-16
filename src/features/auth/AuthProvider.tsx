import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import * as authClient from './authClient';
import { LOADING, SIGNED_OUT, publishAuthStatus, sessionFrom } from './authSession';
import type { AuthState, SignUpResult } from './types';

/**
 * Provides Cognito session state + auth actions to the tree via AuthContext.
 * The ONE writer of AuthState: every transition is `sessionFrom(identity)` or
 * SIGNED_OUT, and the current status is mirrored onto <html data-auth>.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(LOADING);

  const refresh = useCallback(async () => {
    setState(sessionFrom(await authClient.currentIdentity()));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    publishAuthStatus(document.documentElement, state);
  }, [state]);

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

  const resetPassword = useCallback(async (email: string) => {
    await authClient.resetPassword(email);
  }, []);

  const confirmResetPassword = useCallback(
    async (email: string, code: string, newPassword: string) => {
      await authClient.confirmResetPassword(email, code, newPassword);
    },
    [],
  );

  const signOut = useCallback(async () => {
    await authClient.signOut();
    setState(SIGNED_OUT);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signUp,
        confirmSignUp,
        resetPassword,
        confirmResetPassword,
        signOut,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
