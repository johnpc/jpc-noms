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

// Actor identity stamped on every write so the push Lambda knows who acted
// (to notify the OTHER member) and what to say.
interface Actor {
  sub: string;
  label: string;
}

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
