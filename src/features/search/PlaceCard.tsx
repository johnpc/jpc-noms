import { IonCard, IonCardContent, IonButton } from '@ionic/react';
import type { Place } from './types';
import { placeName, placeBlurb, priceLabel } from './place';
import './place.css';

interface Props {
  place: Place;
  /** Primary action label (e.g. "Add to rotation"), omitted for a static card. */
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
}

/** Render-only restaurant card. Shows name, price, a blurb, and an optional action. */
export function PlaceCard({ place, actionLabel, onAction, actionDisabled }: Props) {
  const price = priceLabel(place);
  const blurb = placeBlurb(place);
  return (
    <IonCard className="place-card" data-testid="place-card">
      <IonCardContent>
        <div className="place-card__head">
          <h2 className="place-card__name">{placeName(place)}</h2>
          {price && <span className="place-card__price">{price}</span>}
        </div>
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
      </IonCardContent>
    </IonCard>
  );
}
