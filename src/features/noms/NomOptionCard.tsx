import { usePlace } from '../search/searchApi';
import { PlaceCard } from '../search/PlaceCard';

interface Props {
  googlePlaceId: string;
  actionLabel: string;
  onAction: () => void;
  disabled: boolean;
}

/** Resolves a place id to a card with a single action (Add or Select). */
export function NomOptionCard({ googlePlaceId, actionLabel, onAction, disabled }: Props) {
  const { data: place, isLoading } = usePlace(googlePlaceId);
  if (isLoading || !place) return null;
  return (
    <PlaceCard
      place={place}
      actionLabel={actionLabel}
      actionDisabled={disabled}
      onAction={onAction}
    />
  );
}
