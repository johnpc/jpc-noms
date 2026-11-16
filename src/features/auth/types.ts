/** Auth domain types shared across the auth feature. */

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

/** Who Cognito says is signed in: stable subject + the email they signed in with. */
export interface Identity {
  email: string;
  sub: string;
}

/**
 * The session as a discriminated union: `email`/`sub` exist ONLY in the
 * authenticated arm, so "authenticated with no sub" is unrepresentable and
 * `status === 'authenticated'` narrows both to `string`. Readers that only
 * want the flags keep working (`email ?? ''`).
 */
export type AuthState =
  | { status: 'loading'; email: null; sub: null }
  | { status: 'unauthenticated'; email: null; sub: null }
  | ({ status: 'authenticated' } & Identity);

export interface SignUpResult {
  /** True when Cognito requires an emailed confirmation code next. */
  needsConfirmation: boolean;
}

export type AuthContextValue = AuthState & {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  confirmResetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};
