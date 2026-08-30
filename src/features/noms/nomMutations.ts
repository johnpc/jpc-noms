/**
 * Core nom mutations: add an option, mark selected. Either partner can call
 * these — the nom is multi-owner. Writes go via userPool. Both are optimistic
 * (useNomListMutation): the ['noms'] cache updates at press time and rolls
 * back on error; the poll + subscription reconcile with the server.
 * Lifecycle actions (remove/reopen/delete) live in nomLifecycle.ts.
 */
import { dataClient } from '../../lib/dataClient';
import { withOption } from './nom';
import { upsertNom } from './nomRecord';
import { useNomListMutation } from './useNomListMutation';
import { AUTH, type Actor } from './nomWrite';
import type { Nom } from './types';

type OptionVars = { nom: Nom; placeId: string; actor: Actor };

/** Add a restaurant to a nom's options. */
export function useAddOption() {
  return useNomListMutation(
    async ({ nom, placeId, actor }: OptionVars) => {
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
    (list, { nom, placeId }) =>
      upsertNom(list, { ...nom, optionPlaceIds: withOption(nom, placeId) }),
  );
}

/** Mark a nom's selected restaurant (drives push + Tesla nav downstream). */
export function useSelectOption() {
  return useNomListMutation(
    async ({ nom, placeId, actor }: OptionVars) => {
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
    (list, { nom, placeId, actor }) =>
      upsertNom(list, {
        ...nom,
        selectedPlaceId: placeId,
        selectedBy: actor.label,
        status: 'SELECTED',
      }),
  );
}
