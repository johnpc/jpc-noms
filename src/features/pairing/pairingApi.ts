/**
 * Server state for partner pairing (react-query wrapping the Amplify client).
 * All calls require a signed-in session (userPool) — pairing is between two
 * accounts. The invitee-side lookup uses the inviteeEmail GSI so a partner can
 * find the pending invite addressed to them before they're a member.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataClient } from '../../lib/dataClient';
import { pairingInput, type PairToken } from './qrToken';
import type { Pairing } from './types';

const AUTH = { authMode: 'userPool' } as const;

/** The caller's active/pending pairing (they're a member of it), or null. */
export function usePairing(enabled = true) {
  return useQuery({
    queryKey: ['pairing'],
    enabled,
    queryFn: async (): Promise<Pairing | null> => {
      const { data } = await dataClient.models.Pairing.list(AUTH);
      return (data?.[0] as Pairing) ?? null;
    },
  });
}

/** Invite a partner by email (creates a PENDING pairing owned by the caller). */
export function useCreatePairing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inviteeEmail: string) => {
      const { data } = await dataClient.mutations.invitePartner({ inviteeEmail }, AUTH);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pairing'] }),
  });
}

/** Accept a pending pairing addressed to the caller's email, by its id. */
export function useAcceptPairing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pairingId: string) => {
      const { data } = await dataClient.mutations.acceptInvite({ pairingId }, AUTH);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pairing'] }),
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
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pairing'] }),
  });
}
