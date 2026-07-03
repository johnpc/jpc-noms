/**
 * Core nom mutations: add an option, mark selected. Either partner can call
 * these — the nom is multi-owner. Writes go via userPool; the ['noms'] cache is
 * invalidated on success (and the subscription refreshes the partner's view).
 * Lifecycle actions (remove/reopen/delete) live in nomLifecycle.ts.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dataClient } from '../../lib/dataClient';
import { withOption } from './nom';
import { AUTH, type Actor } from './nomWrite';
import type { Nom } from './types';

/** Add a restaurant to a nom's options. */
export function useAddOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ nom, placeId, actor }: { nom: Nom; placeId: string; actor: Actor }) => {
      await dataClient.models.Nom.update(
        {
          id: nom.id,
          optionPlaceIds: withOption(nom, placeId),
          lastActorSub: actor.sub,
          lastActionText: actor.label,
        },
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
    mutationFn: async ({ nom, placeId, actor }: { nom: Nom; placeId: string; actor: Actor }) => {
      await dataClient.models.Nom.update(
        {
          id: nom.id,
          selectedPlaceId: placeId,
          selectedBy: actor.label,
          status: 'SELECTED',
          lastActorSub: actor.sub,
          lastActionText: actor.label,
        },
        AUTH,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['noms'] }),
  });
}
