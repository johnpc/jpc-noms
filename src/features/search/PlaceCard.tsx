import { IonCard, IonCardContent, IonButton } from '@ionic/react';
import type { Place } from './types';
import { placeName, placeBlurb, priceLabel, placeAddress } from './place';
import { PlacePhoto } from './PlacePhoto';
import './place.css';

interface Props {
  place: Place;
  /** Primary action label (e.g. "Add to rotation"), omitted for a static card. */
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  /** Optional secondary action (e.g. "Remove") shown as a subtle text button. */
  secondaryLabel?: string;
  onSecondary?: () => void;
}

/** Render-only restaurant card. Shows name, price, a blurb, and optional actions. */
export function PlaceCard({
  place,
  actionLabel,
  onAction,
  actionDisabled,
  secondaryLabel,
  onSecondary,
}: Props) {
  const price = priceLabel(place);
  const blurb = placeBlurb(place);
  const address = placeAddress(place);
  return (
    <IonCard className="place-card" data-testid="place-card">
      <PlacePhoto place={place} />
      <IonCardContent>
        <div className="place-card__head">
          <h2 className="place-card__name">{placeName(place)}</h2>
          {price && <span className="place-card__price">{price}</span>}
        </div>
        {address && (
          <p className="place-card__address" data-testid="place-card-address">
            {address}
          </p>
        )}
        {blurb && <p className="place-card__blurb">{blurb}</p>}
        {actionLabel && (
          <IonButton
            size="small"
            fill="solid"
            onClick={onAction}
            disabled={actionDisabled}
            data-testid="place-card-action"
          >
            {actionLabel}
          </IonButton>
        )}
        {secondaryLabel && (
          <IonButton
            size="small"
            fill="clear"
            color="medium"
            onClick={onSecondary}
            disabled={actionDisabled}
            data-testid="place-card-secondary"
          >
            {secondaryLabel}
          </IonButton>
        )}
      </IonCardContent>
    </IonCard>
  );
}
