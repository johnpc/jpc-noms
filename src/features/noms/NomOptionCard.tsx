import { useState } from 'react';
import { IonItem, IonLabel, IonIcon } from '@ionic/react';
import { chevronForward, chevronDown } from 'ionicons/icons';
import { usePlace } from '../search/searchApi';
import { placeName } from '../search/place';
import { PlaceCard } from '../search/PlaceCard';

interface Props {
  googlePlaceId: string;
  actionLabel: string;
  onAction: () => void;
  disabled: boolean;
  /** Optional secondary action (e.g. "Remove"). */
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** When true, render a name-only row that expands to the full card on tap. */
  collapsible?: boolean;
}

/** Resolves a place id to a card with a primary action + optional secondary.
 * When `collapsible`, it starts minified (name only) and expands on tap. */
export function NomOptionCard({
  googlePlaceId,
  actionLabel,
  onAction,
  disabled,
  secondaryLabel,
  onSecondary,
  collapsible,
}: Props) {
  const [open, setOpen] = useState(false);
  const { data: place, isLoading } = usePlace(googlePlaceId);
  if (isLoading || !place) return null;

  if (collapsible && !open) {
    return (
      <IonItem
        button
        detail={false}
        onClick={() => setOpen(true)}
        data-testid="nom-option"
        className="nom-option-mini"
      >
        <IonIcon slot="start" icon={chevronForward} aria-hidden="true" />
        <IonLabel>{placeName(place)}</IonLabel>
      </IonItem>
    );
  }

  return (
    <div data-testid="nom-option">
      {collapsible && (
        <IonItem
          button
          detail={false}
          onClick={() => setOpen(false)}
          className="nom-option-mini"
          data-testid="nom-option-collapse"
        >
          <IonIcon slot="start" icon={chevronDown} aria-hidden="true" />
          <IonLabel>{placeName(place)}</IonLabel>
        </IonItem>
      )}
      <PlaceCard
        place={place}
        actionLabel={actionLabel}
        actionDisabled={disabled}
        onAction={onAction}
        secondaryLabel={secondaryLabel}
        onSecondary={onSecondary}
      />
    </div>
  );
}
