import { IonCard, IonCardContent } from '@ionic/react';
import type { Place } from './types';
import { placeName, placeBlurb, priceLabel, placeAddress, placeLink } from './place';
import { PlacePhoto } from './PlacePhoto';
import { PlaceCardActions, type PlaceActions } from './PlaceCardActions';
import './place.css';

type Props = { place: Place } & PlaceActions;

/** Render-only restaurant card. Shows name, price, a blurb, a website/Maps
 * link, and an optional action row (add-to-rotation / ➕ Nom / remove). */
export function PlaceCard({ place, ...actions }: Props) {
  const price = priceLabel(place);
  const blurb = placeBlurb(place);
  const address = placeAddress(place);
  const link = placeLink(place);
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
        <a
          className="place-card__link"
          href={link.href}
          target="_blank"
          rel="noreferrer"
          data-testid="place-card-website"
        >
          {link.label} ↗
        </a>
        <PlaceCardActions {...actions} />
      </IonCardContent>
    </IonCard>
  );
}
