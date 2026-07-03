/**
 * Pure helpers to read the caller's Cognito identity from an AppSync resolver
 * event. No I/O — unit-tested. The Cognito authorizer puts `sub` on
 * `event.identity`. Email is NOT read here: AppSync's userPool authorizer
 * surfaces access-token claims, which don't carry `email` — the client passes
 * its own signed-in email as a mutation argument instead (see normalizeEmail).
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

/** Normalize a caller-supplied email (trim + lowercase), or throw if empty. */
export function normalizeEmail(email: string | undefined): string {
  const e = email?.trim().toLowerCase();
  if (!e) throw new Error('Missing caller email');
  return e;
}
