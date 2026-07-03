import { useNoms as useNomsQuery, useCreateNom } from './nomsApi';
import { useNomsRealtime } from './useNomsRealtime';
import { useNomMembership } from './useNomMembership';

/**
 * Noms-list logic: the caller's noms (live via subscription) + a create action.
 * A signed-in user can ALWAYS start a nom — solo (members: [self]) when unpaired,
 * or shared (both partners' subs) once an ACTIVE pairing exists. Noms are dated,
 * not named, so create takes no title. Only gated on being signed in.
 */
export function useNomsList() {
  const { signedIn, paired, sub, pairingId, members } = useNomMembership();
  const query = useNomsQuery(signedIn);
  const create = useCreateNom();
  useNomsRealtime(signedIn);

  return {
    signedIn,
    paired,
    noms: query.data ?? [],
    loading: query.isLoading,
    createNom: () => {
      if (!signedIn || !sub) return;
      create.mutate({ pairingId, members });
    },
    creating: create.isPending,
  };
}
