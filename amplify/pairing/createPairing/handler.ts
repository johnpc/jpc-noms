/**
 * createPairing mutation resolver. The signed-in caller (inviter) names their
 * partner's email; we store a PENDING Pairing owned by the inviter. The invitee
 * later calls acceptPairing to join. Thin — identity parsing + the table write
 * live in the mocked shared helpers.
 */
import type { Schema } from '../../data/resource';
import { callerSub, normalizeEmail } from '../shared/identity';
import { putPending } from '../shared/pairingTable';

export const handler: Schema['invitePartner']['functionHandler'] = async (event) => {
  const inviterSub = callerSub(event.identity as Parameters<typeof callerSub>[0]);
  const inviterEmail = normalizeEmail(event.arguments.callerEmail);
  const inviteeEmail = normalizeEmail(event.arguments.inviteeEmail);

  if (inviteeEmail === inviterEmail) {
    throw new Error('You cannot pair with yourself.');
  }
  return putPending({ inviterSub, inviterEmail, inviteeEmail });
};
