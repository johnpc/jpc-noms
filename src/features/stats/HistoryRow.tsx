import { useState } from 'react';
import { IonIcon, IonItem, IonLabel, IonList, IonNote } from '@ionic/react';
import { chevronForward, chevronDown } from 'ionicons/icons';
import { usePlace } from '../search/searchApi';
import { placeName } from '../search/place';
import { nomDateTimeLabel } from '../noms/nomDates';
import type { Nom } from '../noms/types';

/** Resolves one place id to its name for the expanded "other options" list. */
function OptionName({ placeId }: { placeId: string }) {
  const { data: place } = usePlace(placeId);
  return (
    <IonItem className="history-opt" lines="none">
      <IonLabel className="history-opt__name">{place ? placeName(place) : '…'}</IonLabel>
    </IonItem>
  );
}

/**
 * One decided nom in history. Date is the bold title (top); the restaurant that
 * won is the light subtitle (below) — stacked so long names don't collide with
 * the date. Tap the chevron to expand the other options considered that day;
 * tap the row to open the full nom.
 */
export function HistoryRow({ nom }: { nom: Nom }) {
  const [open, setOpen] = useState(false);
  const { data: place } = usePlace(nom.selectedPlaceId ?? undefined);
  const others = nom.optionPlaceIds.filter((id) => id !== nom.selectedPlaceId);

  return (
    <>
      <IonItem
        button
        detail={false}
        routerLink={`/noms/${nom.id}`}
        data-testid="history-row"
        className="history-row"
      >
        {others.length > 0 && (
          <IonIcon
            slot="start"
            icon={open ? chevronDown : chevronForward}
            aria-label="Show other options"
            data-testid="history-expand"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen((v) => !v);
            }}
          />
        )}
        <IonLabel className="history-row__body">
          <h3 className="history-row__date">{nomDateTimeLabel(nom)}</h3>
          <p className="history-row__pick">{place ? placeName(place) : '…'}</p>
        </IonLabel>
        {others.length > 0 && (
          <IonNote slot="end" className="history-row__count">
            +{others.length}
          </IonNote>
        )}
      </IonItem>
      {open && others.length > 0 && (
        <IonList className="history-others" data-testid="history-others">
          {others.map((id) => (
            <OptionName key={id} placeId={id} />
          ))}
        </IonList>
      )}
    </>
  );
}
