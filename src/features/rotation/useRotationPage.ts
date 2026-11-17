import { useAuth } from '../auth/useAuth';
import { useRotation, useRemoveFromRotation, type RotationEntry } from './rotationApi';
import { useAddToNom } from '../noms/useAddToNom';
import { screenGate, type GateScreen } from '../../lib/screenGate';

// @state-machine rotation-screen
export type RotationScreen =
  GateScreen | { kind: 'empty' } | { kind: 'list'; entries: RotationEntry[] };

/** Pure: signed-out / loading, then empty or the saved entries. */
export function rotationScreen(
  signedIn: boolean,
  loading: boolean,
  entries: RotationEntry[],
): RotationScreen {
  const gate = screenGate(signedIn, loading);
  if (gate) return gate;
  return entries.length === 0 ? { kind: 'empty' } : { kind: 'list', entries };
}

/** Rotation-page logic: ONE `screen` union + remove / ➕ Nom actions per entry. */
export function useRotationPage() {
  const { status } = useAuth();
  const signedIn = status === 'authenticated';
  const { data: entries = [], isLoading } = useRotation(signedIn);
  const remove = useRemoveFromRotation();
  const nom = useAddToNom();

  return {
    screen: rotationScreen(signedIn, isLoading, entries),
    remove: (id: string) => remove.mutate(id),
    removing: remove.isPending,
    addToNom: (placeId: string) => void nom.addToNom(placeId),
    addingNom: nom.busy,
    nominatedIds: nom.nominatedIds,
  };
}
