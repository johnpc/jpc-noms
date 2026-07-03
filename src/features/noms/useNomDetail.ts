import { useAuth } from '../auth/useAuth';
import { useNoms as useNomsQuery } from './nomsApi';
import { useNomActions } from './useNomActions';
import { useNomsRealtime } from './useNomsRealtime';
import { useRotation } from '../rotation/rotationApi';
import type { Nom } from './types';

/**
 * Detail logic for one nom: finds it in the live noms list, exposes the user's
 * rotation as candidate options, and the full set of actions (add / remove /
 * select / decide-for-us / reopen / delete) via useNomActions. Kept live via
 * the subscription so the partner's edits stream in.
 */
export function useNomDetail(nomId: string) {
  const { status, email, sub } = useAuth();
  const signedIn = status === 'authenticated';
  const actor = { sub: sub ?? '', label: email ?? '' };
  const { data: noms = [], isLoading } = useNomsQuery(signedIn);
  const rotation = useRotation(signedIn);
  useNomsRealtime(signedIn);

  const nom: Nom | undefined = noms.find((x) => x.id === nomId);
  const actions = useNomActions(nom, actor);

  const rotationIds = (rotation.data ?? []).map((r) => r.googlePlaceId);
  const addable = rotationIds.filter((id) => !nom?.optionPlaceIds.includes(id));

  return { signedIn, loading: isLoading, nom, addable, ...actions };
}
