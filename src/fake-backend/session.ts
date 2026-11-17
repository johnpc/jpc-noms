/**
 * Stand-in for `aws-amplify/auth` (Vite aliases it here in fake mode). A
 * session is one localStorage key; accounts live in the fake db so sign-up
 * works too. Only the SDK surface the app actually imports is implemented.
 */
import { saveDb, loadDb, table, type Row } from './db';
import { DEMO_CODE } from './seed';

// @state-machine fake-session

const SESSION_KEY = 'noms.fake.session';

export interface Account extends Row {
  email: string;
  password: string;
  confirmed: boolean;
}

export const norm = (email: string) => email.trim().toLowerCase();
export const accounts = () => table('accounts') as Account[];
export const find = (email: string) => accounts().find((a) => a.email === norm(email));

/** The signed-in account's sub, or null. */
export function currentSessionSub(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export async function getCurrentUser() {
  const sub = currentSessionSub();
  const acct = sub ? accounts().find((a) => a.id === sub) : undefined;
  if (!acct) throw new Error('UserUnAuthenticatedException: User needs to be authenticated.');
  return { userId: acct.id, username: acct.id, signInDetails: { loginId: acct.email } };
}

export async function fetchAuthSession() {
  const sub = currentSessionSub();
  if (!sub) return { tokens: undefined };
  const payload = { sub, 'cognito:groups': ['editors'] };
  return { tokens: { accessToken: { payload }, idToken: { payload } } };
}

export async function signIn({ username, password }: { username: string; password: string }) {
  const acct = find(username);
  if (!acct || acct.password !== password) throw new Error('Incorrect username or password.');
  if (!acct.confirmed) throw new Error('User is not confirmed.');
  localStorage.setItem(SESSION_KEY, acct.id);
  return { isSignedIn: true, nextStep: { signInStep: 'DONE' } };
}

export async function signUp({ username, password }: { username: string; password: string }) {
  if (find(username)) throw new Error('An account with the given email already exists.');
  accounts().push({
    id: `user-${Date.now().toString(36)}`,
    email: norm(username),
    password,
    confirmed: false,
  });
  saveDb(loadDb());
  return { isSignUpComplete: false, nextStep: { signUpStep: 'CONFIRM_SIGN_UP' } };
}

export async function confirmSignUp({
  username,
  confirmationCode,
}: {
  username: string;
  confirmationCode: string;
}) {
  const acct = find(username);
  if (!acct || confirmationCode !== DEMO_CODE)
    throw new Error('Invalid verification code provided.');
  acct.confirmed = true;
  saveDb(loadDb());
  return { isSignUpComplete: true, nextStep: { signUpStep: 'DONE' } };
}

export async function signOut() {
  localStorage.removeItem(SESSION_KEY);
}

// Password change / reset / delete live in ./sessionAccount (line budget).
export { updatePassword, resetPassword, confirmResetPassword, deleteUser } from './sessionAccount';
