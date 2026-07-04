/**
 * Persists this device's APNs token as a Device row (owner-auth, userPool) so
 * the nom-push Lambda can look it up to notify the partner. Upsert-by-token:
 * we don't duplicate a token that's already registered for this user. The last
 * registered token is cached locally so an opt-out can delete the exact row.
 */
import { dataClient } from '../../lib/dataClient';

const AUTH = { authMode: 'userPool' } as const;
const TOKEN_KEY = 'noms.pushToken';

/** A stable, deterministic id for a token so re-registering the SAME token maps
 * to ONE row (upsert) instead of racing to create duplicates. Not security —
 * just a collision-resistant key derived from the token. */
function deviceId(token: string): string {
  let h = 0;
  for (let i = 0; i < token.length; i++) h = (Math.imul(31, h) + token.charCodeAt(i)) | 0;
  return `dev-${(h >>> 0).toString(16)}-${token.length}`;
}

/**
 * Register this device's APNs token for the signed-in user — idempotent via a
 * deterministic id, so rapid re-registers upsert the one row (no duplicates,
 * race-proof). Create-or-update by that id.
 */
export async function registerDevice(token: string, ownerSub: string): Promise<void> {
  localStorage.setItem(TOKEN_KEY, token);
  const id = deviceId(token);
  const fields = { id, token, platform: 'ios', ownerSub };
  const existing = await dataClient.models.Device.get({ id }, AUTH);
  if (existing.data) {
    await dataClient.models.Device.update(fields, AUTH);
  } else {
    await dataClient.models.Device.create(fields, AUTH);
  }
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
