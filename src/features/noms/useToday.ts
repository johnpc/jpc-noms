import { useAuth } from '../auth/useAuth';
import { useNoms as useNomsQuery } from './nomsApi';
import { useNomActions } from './useNomActions';
import { useNomsRealtime } from './useNomsRealtime';
import { useRotation } from '../rotation/rotationApi';
import { todaysNom, previousDecidedNom } from './nomDates';
import type { Nom } from './types';

/**
 * Home's "Today's nom" logic: the nom created today (calendar day), your
 * rotation as candidate options, the full action set, and the PREVIOUS decided
 * nom for reference ("last time you picked …"). No create button — the nom is
 * created lazily when the first option is added (see useAddToNom). Kept live via
 * the subscription + poll so a partner's edits stream in.
 */
export function useToday() {
  const { status, email, sub } = useAuth();
  const signedIn = status === 'authenticated';
  const actor = { sub: sub ?? '', label: email ?? '' };
  const { data: noms = [], isLoading } = useNomsQuery(signedIn);
  const rotation = useRotation(signedIn);
  useNomsRealtime(signedIn);

  const now = new Date();
  const nom: Nom | undefined = todaysNom(noms, now);
  const previous = previousDecidedNom(noms, nom?.id);
  const actions = useNomActions(nom, actor, '/today');

  const rotationIds = (rotation.data ?? []).map((r) => r.googlePlaceId);
  const addable = rotationIds.filter((id) => !nom?.optionPlaceIds.includes(id));

  return { signedIn, loading: isLoading, nom, previous, addable, ...actions };
}
