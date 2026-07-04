import { IonText } from '@ionic/react';
import { usePlace } from '../search/searchApi';
import { placeName } from '../search/place';
import { selectedByLabel } from './nom';
import type { Nom } from './types';

/** The "we decided" banner for a selected nom — names the winning restaurant
 * (resolved from selectedPlaceId) plus who picked. */
export function SelectedBanner({ nom }: { nom: Nom }) {
  const { data: place } = usePlace(nom.selectedPlaceId ?? undefined);
  const who = selectedByLabel(nom);
  return (
    <IonText color="success">
      <p data-testid="today-selected">
        <strong>{place ? placeName(place) : 'Selected'}</strong> — navigation sent to the car 🚗
        {who && <span> · {who}</span>}
      </p>
    </IonText>
  );
}
