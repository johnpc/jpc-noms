import { useNoms as useNomsQuery, useCreateNom } from './nomsApi';
import { useAddOption } from './nomMutations';
import { useNomMembership } from './useNomMembership';
import { firstOpenNom } from './nom';
import { showToast } from '../../lib/toast';
import { tap } from '../../lib/haptics';
import type { Nom } from './types';

/**
 * The "➕ Nom" action on a restaurant card: drop this place into today's open
 * nom, starting a fresh dated nom if none is open. Zero friction — no picker,
 * no naming. Guests are handled by the caller (search routes them to sign-in).
 */
export function useAddToNom() {
  const { signedIn, sub, actor, pairingId, members } = useNomMembership();
  const { data: noms = [] } = useNomsQuery(signedIn);
  const create = useCreateNom();
  const add = useAddOption();

  const addToNom = async (placeId: string) => {
    if (!signedIn || !sub) return;
    void tap();
    let nom: Nom | undefined = firstOpenNom(noms);
    if (!nom) {
      const created = await create.mutateAsync({ pairingId, members });
      if (!created) return;
      nom = created;
    }
    await add.mutateAsync({ nom, placeId, actor });
    void showToast('Added to your nom 🍽️');
  };

  return { addToNom, busy: create.isPending || add.isPending };
}
