/**
 * Persists this device's APNs token as a Device row (owner-auth, userPool) so
 * the nom-push Lambda can look it up to notify the partner. Upsert-by-token:
 * we don't duplicate a token that's already registered for this user. The last
 * registered token is cached locally so an opt-out can delete the exact row.
 */
import { dataClient } from '../../lib/dataClient';

const AUTH = { authMode: 'userPool' } as const;
const TOKEN_KEY = 'noms.pushToken';

/** Register (once) an APNs token for the signed-in user. */
export async function registerDevice(token: string, ownerSub: string): Promise<void> {
  localStorage.setItem(TOKEN_KEY, token);
  const { data } = await dataClient.models.Device.list(AUTH);
  if ((data ?? []).some((d) => d.token === token)) return;
  await dataClient.models.Device.create({ token, platform: 'ios', ownerSub }, AUTH);
}

/**
 * Remove this device's token(s) so the push Lambda can't deliver to it — the
 * in-app "turn off" (iOS permission itself can only be revoked in iOS Settings).
 * Deletes the locally-cached token's row(s).
 */
export async function unregisterDevice(): Promise<void> {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return;
  const { data } = await dataClient.models.Device.list(AUTH);
  const mine = (data ?? []).filter((d) => d.token === token);
  await Promise.all(mine.map((d) => dataClient.models.Device.delete({ id: d.id }, AUTH)));
}
