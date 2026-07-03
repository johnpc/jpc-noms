/**
 * Server state for partner pairing (react-query wrapping the Amplify client).
 * All calls require a signed-in session (userPool) — pairing is between two
 * accounts. The invitee-side lookup uses the inviteeEmail GSI so a partner can
 * find the pending invite addressed to them before they're a member.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataClient } from '../../lib/dataClient';
import { pairingInput, type PairToken } from './qrToken';
import { adoptSoloNoms, fetchCallerPairing } from './pairingNoms';

const AUTH = { authMode: 'userPool' } as const;

/**
 * The caller's active/pending pairing, or null (owned rows + invites addressed
 * to their email — see fetchCallerPairing). Keyed by email so the invitee lookup
 * re-runs when the session resolves.
 */
export function usePairing(enabled = true, email = '') {
  return useQuery({
    queryKey: ['pairing', email],
    enabled,
    queryFn: () => fetchCallerPairing(email),
  });
}

/**
 * Invite a partner by email (creates a PENDING pairing owned by the caller).
 * `callerEmail` is the inviter's own signed-in email — passed explicitly because
 * AppSync's userPool authorizer exposes access-token claims, which omit `email`.
 */
export function useCreatePairing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { inviteeEmail: string; callerEmail: string }) => {
      const { data } = await dataClient.mutations.invitePartner(args, AUTH);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pairing'] }),
  });
}

/** Accept a pending pairing addressed to the caller's email, by its id. */
export function useAcceptPairing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { pairingId: string; callerEmail: string }) => {
      const { data } = await dataClient.mutations.acceptInvite(args, AUTH);
      if (data?.members) await adoptSoloNoms(data.id, data.members);
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['pairing'] });
      void qc.invalidateQueries({ queryKey: ['noms'] });
    },
  });
}

/**
 * QR pairing: I scanned my partner's code — create ONE ACTIVE Pairing with both
 * subs. Multi-owner auth lets me include the partner as a member (I'm a member
 * too), so no Lambda is needed; the partner's app sees it live via the Pairing
 * subscription. Throws if I scanned my own code.
 */
export function usePairByScan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ me, partner }: { me: PairToken; partner: PairToken }) => {
      const input = pairingInput(me, partner);
      if (!input) throw new Error("That's your own code — scan your partner's.");
      const { data } = await dataClient.models.Pairing.create(input, AUTH);
      if (data) await adoptSoloNoms(data.id, input.members);
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['pairing'] });
      void qc.invalidateQueries({ queryKey: ['noms'] });
    },
  });
}

/** Undo a pairing (delete it). Both apps drop back to unpaired via the subscription. */
export function useUnpair() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pairingId: string) => {
      await dataClient.models.Pairing.delete({ id: pairingId }, AUTH);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pairing'] }),
  });
}
