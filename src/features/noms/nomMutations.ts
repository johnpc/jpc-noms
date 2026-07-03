/**
 * Mutations that update a shared nom (add an option, mark selected). Either
 * partner can call these — the nom is multi-owner. Writes go via userPool; the
 * ['noms'] cache is invalidated on success (and the subscription refreshes the
 * partner's view too).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dataClient } from '../../lib/dataClient';
import { withOption } from './nom';
import type { Nom } from './types';

const AUTH = { authMode: 'userPool' } as const;

/** Add a restaurant to a nom's options. */
export function useAddOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ nom, placeId }: { nom: Nom; placeId: string }) => {
      await dataClient.models.Nom.update(
        { id: nom.id, optionPlaceIds: withOption(nom, placeId) },
        AUTH,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['noms'] }),
  });
}

/** Mark a nom's selected restaurant (drives push + Tesla nav downstream). */
export function useSelectOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ nom, placeId, by }: { nom: Nom; placeId: string; by: string }) => {
      await dataClient.models.Nom.update(
        { id: nom.id, selectedPlaceId: placeId, selectedBy: by, status: 'SELECTED' },
        AUTH,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['noms'] }),
  });
}
