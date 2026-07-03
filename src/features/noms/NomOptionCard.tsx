import { usePlace } from '../search/searchApi';
import { PlaceCard } from '../search/PlaceCard';

interface Props {
  googlePlaceId: string;
  actionLabel: string;
  onAction: () => void;
  disabled: boolean;
  /** Optional secondary action (e.g. "Remove"). */
  secondaryLabel?: string;
  onSecondary?: () => void;
}

/** Resolves a place id to a card with a primary action + optional secondary. */
export function NomOptionCard({
  googlePlaceId,
  actionLabel,
  onAction,
  disabled,
  secondaryLabel,
  onSecondary,
}: Props) {
  const { data: place, isLoading } = usePlace(googlePlaceId);
  if (isLoading || !place) return null;
  return (
    <PlaceCard
      place={place}
      actionLabel={actionLabel}
      actionDisabled={disabled}
      onAction={onAction}
      secondaryLabel={secondaryLabel}
      onSecondary={onSecondary}
    />
  );
}
