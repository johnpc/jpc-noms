/**
 * Nom lifecycle mutations (remove option, re-open, delete) — the "fix a
 * mistake" actions, split from nomMutations to respect the file-line budget.
 * Multi-owner; writes via userPool; the ['noms'] cache refreshes on success
 * (and the subscription streams the change to the partner).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dataClient } from '../../lib/dataClient';
import { withoutOption } from './nom';
import { AUTH, type Actor } from './nomWrite';
import type { Nom } from './types';

const refresh = (qc: ReturnType<typeof useQueryClient>) => () =>
  qc.invalidateQueries({ queryKey: ['noms'] });

/** Remove an option from a nom. */
export function useRemoveOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ nom, placeId, actor }: { nom: Nom; placeId: string; actor: Actor }) => {
      await dataClient.models.Nom.update(
        {
          id: nom.id,
          optionPlaceIds: withoutOption(nom, placeId),
          lastActorSub: actor.sub,
          lastActionText: actor.label,
        },
        AUTH,
      );
    },
    onSuccess: refresh(qc),
  });
}

/** Re-open a selected nom (clears the selection). */
export function useReopenNom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ nom, actor }: { nom: Nom; actor: Actor }) => {
      await dataClient.models.Nom.update(
        {
          id: nom.id,
          selectedPlaceId: null,
          selectedBy: null,
          status: 'OPEN',
          lastActorSub: actor.sub,
          lastActionText: actor.label,
        },
        AUTH,
      );
    },
    onSuccess: refresh(qc),
  });
}

/** Delete a nom entirely. */
export function useDeleteNom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (nomId: string) => {
      await dataClient.models.Nom.delete({ id: nomId }, AUTH);
    },
    onSuccess: refresh(qc),
  });
}
