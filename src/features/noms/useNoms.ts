import { useAuth } from '../auth/useAuth';
import { usePairing } from '../pairing/pairingApi';
import { useNoms as useNomsQuery, useCreateNom } from './nomsApi';
import { useNomsRealtime } from './useNomsRealtime';

/**
 * Noms-list logic: the caller's noms (live via subscription) + a create action.
 * A signed-in user can ALWAYS start a nom — solo (members: [self]) when unpaired,
 * or shared (both partners' subs) once an ACTIVE pairing exists. Pairing later
 * just adds the partner to a nom's members. Only gated on being signed in.
 */
export function useNomsList() {
  const { status, sub } = useAuth();
  const signedIn = status === 'authenticated';
  const { data: pairing } = usePairing(signedIn);
  const query = useNomsQuery(signedIn);
  const create = useCreateNom();
  useNomsRealtime(signedIn);

  const active = pairing?.status === 'ACTIVE' ? pairing : null;

  return {
    signedIn,
    paired: !!active,
    noms: query.data ?? [],
    loading: query.isLoading,
    createNom: (title: string) => {
      if (!signedIn || !sub) return;
      const members = active ? active.members : [sub];
      const pairingId = active ? active.id : 'solo';
      create.mutate({ pairingId, members, title });
    },
    creating: create.isPending,
  };
}
