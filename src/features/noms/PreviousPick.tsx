import { IonText } from '@ionic/react';
import { usePlace } from '../search/searchApi';
import { placeName } from '../search/place';
import { nomDateLabel } from './nom';
import type { Nom } from './types';

/** "Last time you picked <place> (<date>)" — reference on the Today screen. */
export function PreviousPick({ nom }: { nom: Nom }) {
  const { data: place } = usePlace(nom.selectedPlaceId ?? undefined);
  if (!place) return null;
  return (
    <IonText color="medium">
      <p data-testid="today-previous">
        Last time: <strong>{placeName(place)}</strong> · {nomDateLabel(nom)}
      </p>
    </IonText>
  );
}
