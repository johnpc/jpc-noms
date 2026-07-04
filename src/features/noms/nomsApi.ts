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
    // The subscription (useNomsRealtime) is the fast path, but a mobile websocket
    // drops when the app backgrounds and can silently miss updates (a partner's
    // added option never arrives → stale option counts). Poll as a backstop so
    // the list self-heals within a few seconds even if a subscription event was
    // lost; refetchOnWindowFocus/reconnect + the resume listener catch the rest.
    refetchInterval: 8000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    queryFn: async (): Promise<Nom[]> => {
      // Page through ALL noms — the default list caps at 100, which silently hid
      // most of the migrated history (259 rows) from Stats + the previous-pick.
      const rows: Record<string, unknown>[] = [];
      let nextToken: string | undefined;
      do {
        const { data, nextToken: nt } = await dataClient.models.Nom.list({ ...AUTH, nextToken });
        rows.push(...((data ?? []) as Record<string, unknown>[]));
        nextToken = nt ?? undefined;
      } while (nextToken);
      return rows.map((r) => toNom(r));
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
