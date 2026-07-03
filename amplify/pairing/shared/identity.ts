/**
 * Pure helpers to read the caller's Cognito identity from an AppSync resolver
 * event. No I/O — unit-tested. The Cognito authorizer puts `sub` and the email
 * claim on `event.identity`.
 */
export interface ResolverIdentity {
  sub?: string;
  claims?: Record<string, unknown>;
}

/** The caller's Cognito subject (user id), or throws if unauthenticated. */
export function callerSub(identity: ResolverIdentity | undefined): string {
  const sub = identity?.sub ?? (identity?.claims?.sub as string | undefined);
  if (!sub) throw new Error('Unauthenticated: no caller sub');
  return sub;
}

/** The caller's email claim, lowercased, or throws if absent. */
export function callerEmail(identity: ResolverIdentity | undefined): string {
  const email = identity?.claims?.email as string | undefined;
  if (!email) throw new Error('No email claim on the caller');
  return email.trim().toLowerCase();
}
