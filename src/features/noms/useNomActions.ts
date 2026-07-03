import { useHistory } from 'react-router-dom';
import { useAddOption, useSelectOption } from './nomMutations';
import { useRemoveOption, useReopenNom, useDeleteNom } from './nomLifecycle';
import { pickRandomOption } from './nom';
import { tap } from '../../lib/haptics';
import { randomFraction } from '../../lib/random';
import type { Actor } from './nomWrite';
import type { Nom } from './types';

/**
 * All the write actions for one nom, bundled so useNomDetail stays a thin
 * composition. Each fires a haptic tap (native) and routes/refreshes as needed.
 * "Decide for us" picks a random option and selects it — same downstream path
 * (push + Tesla nav) as a manual select.
 */
export function useNomActions(nom: Nom | undefined, actor: Actor) {
  const history = useHistory();
  const add = useAddOption();
  const select = useSelectOption();
  const remove = useRemoveOption();
  const reopen = useReopenNom();
  const del = useDeleteNom();

  const doSelect = (placeId: string) => {
    if (!nom) return;
    void tap();
    select.mutate({ nom, placeId, actor });
  };

  return {
    add: (placeId: string) => {
      if (!nom) return;
      void tap();
      add.mutate({ nom, placeId, actor });
    },
    select: doSelect,
    remove: (placeId: string) => nom && remove.mutate({ nom, placeId, actor }),
    reopen: () => nom && reopen.mutate({ nom, actor }),
    decideForUs: () => {
      const pick = nom && pickRandomOption(nom, randomFraction());
      if (pick) doSelect(pick);
    },
    del: () => {
      if (!nom) return;
      del.mutate(nom.id, { onSuccess: () => history.replace('/noms') });
    },
    busy:
      add.isPending || select.isPending || remove.isPending || reopen.isPending || del.isPending,
  };
}
