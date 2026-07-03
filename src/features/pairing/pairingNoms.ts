import { dataClient } from '../../lib/dataClient';
import type { Pairing } from './types';

const AUTH = { authMode: 'userPool' } as const;

/**
 * The caller's active/pending pairing, or null — merges two lookups: rows the
 * caller OWNS (they're in `members`; covers what they created + any ACTIVE
 * pairing) AND rows addressed to their email via the inviteeEmail GSI (a PENDING
 * invite where they're NOT yet a member, so list() can't see it). Prefers an
 * ACTIVE row. The GSI lookup is what lets an invitee see "X invited you".
 */
export async function fetchCallerPairing(email: string): Promise<Pairing | null> {
  const mine = (await dataClient.models.Pairing.list(AUTH)).data ?? [];
  const invited = email
    ? ((await dataClient.models.Pairing.listPairingByInviteeEmail({ inviteeEmail: email }, AUTH))
        .data ?? [])
    : [];
  const byId = new Map([...mine, ...invited].map((p) => [p.id, p as Pairing]));
  const rows = [...byId.values()];
  return rows.find((p) => p.status === 'ACTIVE') ?? rows[0] ?? null;
}

/**
 * When a pairing goes ACTIVE, adopt the caller's pre-pairing SOLO noms into it:
 * set members to both partners + pairingId to the pairing. Without this, a nom
 * created before pairing stays members:[creator] and the partner can't see it
 * (allow.ownersDefinedIn). Each partner adopts their own solo noms. Best-effort.
 */
export async function adoptSoloNoms(pairingId: string, members: string[]): Promise<void> {
  const { data } = await dataClient.models.Nom.list(AUTH);
  const solo = (data ?? []).filter((n) => n.pairingId === 'solo' || n.pairingId == null);
  await Promise.all(
    solo.map((n) => dataClient.models.Nom.update({ id: n.id, members, pairingId }, AUTH)),
  );
}
