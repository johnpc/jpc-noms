/**
 * Thin wrapper over Amplify Auth. Isolates the SDK so the provider stays
 * declarative and tests can mock a single module.
 */
import {
  getCurrentUser,
  fetchAuthSession,
  signIn as amplifySignIn,
  signUp as amplifySignUp,
  confirmSignUp as amplifyConfirmSignUp,
  signOut as amplifySignOut,
  updatePassword as amplifyUpdatePassword,
  resetPassword as amplifyResetPassword,
  confirmResetPassword as amplifyConfirmResetPassword,
  deleteUser as amplifyDeleteUser,
} from 'aws-amplify/auth';
import type { Identity, SignUpResult } from './types';

/**
 * The signed-in user's identity (email + stable Cognito subject), or null when
 * there is no session. One SDK call for both so the session can never resolve
 * half-populated (an email without a sub).
 */
export async function currentIdentity(): Promise<Identity | null> {
  try {
    const user = await getCurrentUser();
    return { email: user.signInDetails?.loginId ?? user.username, sub: user.userId };
  } catch {
    return null;
  }
}

/** Cognito groups for the signed-in user (from the id token), or []. */
export async function currentGroups(): Promise<string[]> {
  try {
    const session = await fetchAuthSession();
    const claim = session.tokens?.idToken?.payload['cognito:groups'];
    return Array.isArray(claim) ? claim.map(String) : [];
  } catch {
    return [];
  }
}

export async function signIn(email: string, password: string): Promise<void> {
  await amplifySignIn({ username: email, password });
}

export async function signUp(email: string, password: string): Promise<SignUpResult> {
  const { nextStep } = await amplifySignUp({
    username: email,
    password,
    options: { userAttributes: { email } },
  });
  return { needsConfirmation: nextStep.signUpStep === 'CONFIRM_SIGN_UP' };
}

export async function confirmSignUp(email: string, code: string): Promise<void> {
  await amplifyConfirmSignUp({ username: email, confirmationCode: code });
}

export async function signOut(): Promise<void> {
  await amplifySignOut();
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  await amplifyUpdatePassword({ oldPassword, newPassword });
}

/** Starts the forgot-password flow: Cognito emails a reset code. */
export async function resetPassword(email: string): Promise<void> {
  await amplifyResetPassword({ username: email });
}

/** Completes the forgot-password flow with the emailed code + new password. */
export async function confirmResetPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<void> {
  await amplifyConfirmResetPassword({ username: email, confirmationCode: code, newPassword });
}

export async function deleteAccount(): Promise<void> {
  await amplifyDeleteUser();
}
