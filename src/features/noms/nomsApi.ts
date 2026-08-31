/**
 * Server state for collaborative noms (react-query wrapping the Amplify
 * client). Noms are multi-owner (both partners), so all calls use `userPool`.
 * The subscription provider keeps the ['noms'] cache live — see useNomsRealtime.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataClient } from '../../lib/dataClient';
import { nomFromRecord, upsertNom } from './nomRecord';
import { useNomMembership } from './useNomMembership';
import { fetchNoms } from './nomsFetch';
import type { Nom } from './types';

const AUTH = { authMode: 'userPool' } as const;

/** All noms the caller is a member of (both partners see the same set). */
export function useNoms(enabled = true) {
  const { pairingId, sub } = useNomMembership(enabled);
  const qc = useQueryClient();
  return useQuery({
    queryKey: ['noms'],
    enabled,
    // The subscription (useNomsRealtime) is the fast path, but a mobile websocket
    // drops when the app backgrounds and can silently miss updates (a partner's
    // added option never arrives → stale option counts). Poll as a backstop so
    // the list self-heals within a few seconds even if a subscription event was
    // lost; refetchOnWindowFocus/reconnect + the resume listener catch the rest.
    refetchInterval: 8000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    // First load pages the FULL history (Stats needs it); every later refetch
    // is a small recently-updated query merged over the cache — see nomsFetch.
    queryFn: () => fetchNoms(qc.getQueryData<Nom[]>(['noms']), pairingId, sub ?? ''),
  });
}

/** Create an OPEN nom for the pairing (both members can read/write it).
 * The created row is written straight into the ['noms'] cache — NOT an
 * invalidate-refetch: returning invalidateQueries from onSuccess held
 * isPending until the FULL history re-paged (259+ rows), graying the UI for
 * seconds after every ➕ Nom that started a fresh nom. */
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
    onSuccess: (created) => {
      if (created) qc.setQueryData<Nom[]>(['noms'], (list) => upsertNom(list, created));
    },
  });
}
