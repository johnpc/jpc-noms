/**
 * acceptPairing mutation resolver. The invitee accepts a PENDING pairing that
 * was addressed to their email: we verify the pairing's inviteeEmail matches
 * the caller's email claim, then add the caller's sub to `members` and flip it
 * to ACTIVE. This is the privileged step the invitee couldn't do directly (they
 * weren't yet an owner of the multi-owner row).
 */
import type { Schema } from '../../data/resource';
import { callerSub, callerEmail } from '../shared/identity';
import { getPairing, activate } from '../shared/pairingTable';

export const handler: Schema['acceptInvite']['functionHandler'] = async (event) => {
  const sub = callerSub(event.identity as Parameters<typeof callerSub>[0]);
  const email = callerEmail(event.identity as Parameters<typeof callerEmail>[0]);

  const pairing = await getPairing(event.arguments.pairingId);
  if (!pairing) throw new Error('Pairing not found.');
  if (pairing.inviteeEmail.toLowerCase() !== email) {
    throw new Error('This pairing invite is addressed to a different email.');
  }
  if (pairing.status === 'ACTIVE') return pairing;

  return activate(pairing.id, sub, pairing.members);
};
