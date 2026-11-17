/**
 * The fake Cognito's account-recovery surface (change / reset / delete), split
 * from ./session to hold the line budget. Codes are the demo code.
 */
import { saveDb, loadDb } from './db';
import { DEMO_CODE } from './seed';
import { accounts, currentSessionSub, find, signOut } from './session';

export async function updatePassword({
  oldPassword,
  newPassword,
}: {
  oldPassword: string;
  newPassword: string;
}) {
  const acct = accounts().find((a) => a.id === currentSessionSub());
  if (!acct || acct.password !== oldPassword) throw new Error('Incorrect username or password.');
  acct.password = newPassword;
  saveDb(loadDb());
}

export async function resetPassword({ username }: { username: string }) {
  if (!find(username)) throw new Error('Username/client id combination not found.');
}

export async function confirmResetPassword(args: {
  username: string;
  confirmationCode: string;
  newPassword: string;
}) {
  const acct = find(args.username);
  if (!acct || args.confirmationCode !== DEMO_CODE)
    throw new Error('Invalid verification code provided.');
  acct.password = args.newPassword;
  saveDb(loadDb());
}

export async function deleteUser() {
  const db = loadDb();
  db.tables.accounts = accounts().filter((a) => a.id !== currentSessionSub());
  saveDb(db);
  await signOut();
}
