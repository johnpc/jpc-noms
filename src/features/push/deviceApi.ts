/**
 * Persists this device's APNs token as a Device row (owner-auth, userPool) so
 * the nom-push Lambda can look it up to notify the partner. Upsert-by-token:
 * we don't duplicate a token that's already registered for this user.
 */
import { dataClient } from '../../lib/dataClient';

const AUTH = { authMode: 'userPool' } as const;

/** Register (once) an APNs token for the signed-in user. */
export async function registerDevice(token: string, ownerSub: string): Promise<void> {
  const { data } = await dataClient.models.Device.list(AUTH);
  if ((data ?? []).some((d) => d.token === token)) return;
  await dataClient.models.Device.create({ token, platform: 'ios', ownerSub }, AUTH);
}
