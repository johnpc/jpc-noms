import { useAuth } from '../auth/useAuth';
import { useNoms as useNomsQuery } from './nomsApi';
import { useAddOption, useSelectOption } from './nomMutations';
import { useNomsRealtime } from './useNomsRealtime';
import { useRotation } from '../rotation/rotationApi';
import type { Nom } from './types';

/**
 * Detail logic for one nom: finds it in the live noms list, exposes the user's
 * rotation as candidate options, and add/select actions (either partner can do
 * both). Kept live via the subscription so the partner's edits stream in.
 */
export function useNomDetail(nomId: string) {
  const { status, email } = useAuth();
  const signedIn = status === 'authenticated';
  const { data: noms = [], isLoading } = useNomsQuery(signedIn);
  const rotation = useRotation(signedIn);
  const addOption = useAddOption();
  const select = useSelectOption();
  useNomsRealtime(signedIn);

  const nom: Nom | undefined = noms.find((x) => x.id === nomId);
  const rotationIds = (rotation.data ?? []).map((r) => r.googlePlaceId);
  const addable = rotationIds.filter((id) => !nom?.optionPlaceIds.includes(id));

  return {
    signedIn,
    loading: isLoading,
    nom,
    addable,
    add: (placeId: string) => nom && addOption.mutate({ nom, placeId }),
    adding: addOption.isPending,
    select: (placeId: string) => nom && select.mutate({ nom, placeId, by: email ?? '' }),
    selecting: select.isPending,
  };
}
