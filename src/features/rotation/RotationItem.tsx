import { usePlace } from '../search/searchApi';
import { PlaceCard } from '../search/PlaceCard';

interface Props {
  googlePlaceId: string;
  onRemove: () => void;
  removing: boolean;
}

/** One rotation entry: resolves the place details, renders a card with Remove. */
export function RotationItem({ googlePlaceId, onRemove, removing }: Props) {
  const { data: place, isLoading } = usePlace(googlePlaceId);
  if (isLoading || !place) return null;
  return (
    <PlaceCard place={place} actionLabel="Remove" actionDisabled={removing} onAction={onRemove} />
  );
}
