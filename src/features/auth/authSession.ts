/** Pure transitions for the auth session machine — no I/O, unit-tested. */
import type { AuthState, Identity } from './types';

// @state-machine auth-session

export const LOADING: AuthState = { status: 'loading', email: null, sub: null };
export const SIGNED_OUT: AuthState = { status: 'unauthenticated', email: null, sub: null };

/** What a resolved Cognito lookup means for the session. */
export function sessionFrom(identity: Identity | null): AuthState {
  return identity ? { status: 'authenticated', ...identity } : SIGNED_OUT;
}

/**
 * Mirror the session onto <html data-auth="…"> so anything outside React —
 * the e2e harness, an agent driving the app, CSS — can observe the ONE owner's
 * state without reading SDK storage keys. Returns the attribute value written.
 */
export function publishAuthStatus(doc: { dataset: DOMStringMap }, state: AuthState): string {
  doc.dataset.auth = state.status;
  return state.status;
}
