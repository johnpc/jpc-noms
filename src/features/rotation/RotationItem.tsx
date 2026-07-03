import { usePlace } from '../search/searchApi';
import { PlaceCard } from '../search/PlaceCard';

interface Props {
  googlePlaceId: string;
  onRemove: () => void;
  removing: boolean;
  onNom: () => void;
  addingNom: boolean;
}

/** One rotation entry: resolves the place, renders a card with ➕ Nom + Remove. */
export function RotationItem({ googlePlaceId, onRemove, removing, onNom, addingNom }: Props) {
  const { data: place, isLoading } = usePlace(googlePlaceId);
  if (isLoading || !place) return null;
  return (
    <PlaceCard
      place={place}
      actionLabel="Remove"
      actionDisabled={removing}
      onAction={onRemove}
      onNom={onNom}
      nomDisabled={addingNom}
    />
  );
}
