import { IonItem, IonLabel, IonNote } from '@ionic/react';
import { usePlace } from '../search/searchApi';
import { placeName } from '../search/place';
import { nomDateLabel } from '../noms/nom';
import type { Nom } from '../noms/types';

/** One decided nom in the history list: its date + the restaurant that won. */
export function HistoryRow({ nom }: { nom: Nom }) {
  const { data: place } = usePlace(nom.selectedPlaceId ?? undefined);
  return (
    <IonItem data-testid="history-row">
      <IonLabel>{nomDateLabel(nom)}</IonLabel>
      <IonNote slot="end">{place ? placeName(place) : '…'}</IonNote>
    </IonItem>
  );
}
