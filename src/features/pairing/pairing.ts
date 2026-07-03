/** Pure pairing view helpers — no I/O, unit-tested. */
import type { Pairing } from './types';

export type PairingView =
  | { kind: 'none' }
  | { kind: 'pending-sent'; partnerEmail: string }
  | { kind: 'pending-received'; partnerEmail: string; pairingId: string }
  | { kind: 'active'; partnerEmail: string; pairingId: string };

/**
 * Classify a pairing from the current user's perspective. `myEmail` decides
 * whether a PENDING invite was sent by me (waiting on them) or is addressed to
 * me (I can accept it).
 */
export function pairingView(pairing: Pairing | null, myEmail: string): PairingView {
  if (!pairing) return { kind: 'none' };
  const me = myEmail.trim().toLowerCase();
  const iAmInvitee = pairing.inviteeEmail.toLowerCase() === me;
  const partnerEmail = iAmInvitee ? pairing.inviterEmail : pairing.inviteeEmail;

  if (pairing.status === 'ACTIVE') return { kind: 'active', partnerEmail, pairingId: pairing.id };
  if (iAmInvitee) return { kind: 'pending-received', partnerEmail, pairingId: pairing.id };
  return { kind: 'pending-sent', partnerEmail };
}
