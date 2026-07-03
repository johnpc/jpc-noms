/**
 * Server state for partner pairing (react-query wrapping the Amplify client).
 * All calls require a signed-in session (userPool) — pairing is between two
 * accounts. The invitee-side lookup uses the inviteeEmail GSI so a partner can
 * find the pending invite addressed to them before they're a member.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataClient } from '../../lib/dataClient';
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
