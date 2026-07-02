/** Auth domain types shared across the auth feature. */

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  status: AuthStatus;
  /** Cognito username (email) of the signed-in user, when authenticated. */
  email: string | null;
}

export interface SignUpResult {
  /** True when Cognito requires an emailed confirmation code next. */
  needsConfirmation: boolean;
}

export interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}
