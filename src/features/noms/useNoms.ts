import { useNoms as useNomsQuery, useCreateNom } from './nomsApi';
import { useNomsRealtime } from './useNomsRealtime';
import { useNomMembership } from './useNomMembership';
import { nomsListScreen } from './nomScreens';

/**
 * Noms-list logic: ONE `screen` union (signed-out / loading / empty / list)
 * over the caller's noms (live via subscription) + a create action. A signed-in
 * user can ALWAYS start a nom — solo (members: [self]) when unpaired, or shared
 * (both partners' subs) once an ACTIVE pairing exists. Noms are dated, not
 * named, so create takes no title.
 */
export function useNomsList() {
  const { signedIn, paired, sub, pairingId, members } = useNomMembership();
  const query = useNomsQuery(signedIn);
  const create = useCreateNom();
  useNomsRealtime(signedIn);

  return {
    screen: nomsListScreen(signedIn, query.isLoading, query.data ?? []),
    paired,
    createNom: () => {
      if (!signedIn || !sub) return;
      create.mutate({ pairingId, members });
    },
    creating: create.isPending,
  };
}
