import { useAuth } from '../auth/useAuth';
import { usePairing } from '../pairing/pairingApi';
import { useNoms as useNomsQuery, useCreateNom } from './nomsApi';
import { useNomsRealtime } from './useNomsRealtime';

/**
 * Noms-list logic: the caller's shared noms (live via subscription), plus a
 * create action that stamps the active pairing's members onto the new nom so
 * both partners own it. Gated on a signed-in session + an ACTIVE pairing.
 */
export function useNomsList() {
  const { status } = useAuth();
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
    createNom: (title: string) =>
      active && create.mutate({ pairingId: active.id, members: active.members, title }),
    creating: create.isPending,
  };
}
