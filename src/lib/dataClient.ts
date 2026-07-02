/**
 * Shared Amplify Data client (typed against the backend Schema).
 *
 * Auth mode is chosen per call by readAuthMode(): signed-in users read via
 * 'userPool' (group claims ride in the JWT — immune to identity-pool role
 * remapping for Cognito group members), while anonymous visitors read via
 * 'identityPool' (the guest role). Mirrors stoop ADR 0004 — a client/schema
 * provider mismatch returns empty results, not an error.
 */
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { Schema } from '../../amplify/data/resource';

export const dataClient = generateClient<Schema>({ authMode: 'identityPool' });

/** 'userPool' when a Cognito session exists, else 'identityPool' (guest). */
export async function readAuthMode(): Promise<'userPool' | 'identityPool'> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.accessToken ? 'userPool' : 'identityPool';
  } catch {
    return 'identityPool';
  }
}
