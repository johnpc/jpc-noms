/**
 * Server state for collaborative noms (react-query wrapping the Amplify
 * client). Noms are multi-owner (both partners), so all calls use `userPool`.
 * The subscription provider keeps the ['noms'] cache live — see useNomsRealtime.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataClient } from '../../lib/dataClient';
import { nomFromRecord } from './nomRecord';
import type { Nom } from './types';

const AUTH = { authMode: 'userPool' } as const;

const toNom = nomFromRecord;

/** All noms the caller is a member of (both partners see the same set). */
export function useNoms(enabled = true) {
  return useQuery({
    queryKey: ['noms'],
    enabled,
    queryFn: async (): Promise<Nom[]> => {
      const { data } = await dataClient.models.Nom.list(AUTH);
      return (data ?? []).map((r) => toNom(r as Record<string, unknown>));
    },
  });
}

/** Create an OPEN nom for the pairing (both members can read/write it). */
export function useCreateNom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { pairingId: string; members: string[] }) => {
      const { data } = await dataClient.models.Nom.create(
        { ...input, optionPlaceIds: [], status: 'OPEN' },
        AUTH,
      );
      return data ? nomFromRecord(data as unknown as Record<string, unknown>) : null;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['noms'] }),
  });
}
