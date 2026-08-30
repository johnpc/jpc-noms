/**
 * Nom lifecycle mutations (remove option, re-open, delete) — the "fix a
 * mistake" actions, split from nomMutations to respect the file-line budget.
 * Multi-owner; writes via userPool. All optimistic (useNomListMutation): the
 * ['noms'] cache updates at press time and rolls back on error; the poll +
 * subscription reconcile with the server.
 */
import { dataClient } from '../../lib/dataClient';
import { withoutOption } from './nom';
import { upsertNom, removeNom } from './nomRecord';
import { useNomListMutation } from './useNomListMutation';
import { AUTH, type Actor } from './nomWrite';
import type { Nom } from './types';

/** Remove an option from a nom. */
export function useRemoveOption() {
  return useNomListMutation(
    async ({ nom, placeId, actor }: { nom: Nom; placeId: string; actor: Actor }) => {
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
    (list, { nom, placeId }) =>
      upsertNom(list, { ...nom, optionPlaceIds: withoutOption(nom, placeId) }),
  );
}

/** Re-open a selected nom (clears the selection). */
export function useReopenNom() {
  return useNomListMutation(
    async ({ nom, actor }: { nom: Nom; actor: Actor }) => {
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
    (list, { nom }) =>
      upsertNom(list, { ...nom, selectedPlaceId: null, selectedBy: null, status: 'OPEN' }),
  );
}

/** Delete a nom entirely. */
export function useDeleteNom() {
  return useNomListMutation(
    async (nomId: string) => {
      await dataClient.models.Nom.delete({ id: nomId }, AUTH);
    },
    (list, nomId) => removeNom(list, nomId),
  );
}
