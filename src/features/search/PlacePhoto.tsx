import { usePlaceImage } from './searchApi';
import type { Place } from './types';

/** Renders a place's first photo as a card banner. Nothing until it resolves
 * (or if the place has no photos) — so text-only places stay clean. */
export function PlacePhoto({ place }: { place: Place }) {
  const photoId = (place.photos ?? []).find((p): p is string => !!p);
  const { data: uri } = usePlaceImage(photoId);
  if (!photoId || !uri) return null;
  return (
    <img
      className="place-card__photo"
      src={uri}
      alt={place.displayName?.text ?? place.name}
      loading="lazy"
      data-testid="place-card-photo"
    />
  );
}
