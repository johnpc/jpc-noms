import { IonText } from '@ionic/react';
import { NomOptionCard } from './NomOptionCard';
import type { Nom } from './types';

interface Props {
  nom: Nom;
  selected: boolean;
  addable: string[];
  busy: boolean;
  onSelect: (placeId: string) => void;
  onRemove: (placeId: string) => void;
  onAdd: (placeId: string) => void;
}

/** The options list + "add from rotation" list for a nom. Extracted from
 * NomDetail so that screen stays simple (low complexity / line budget). */
export function NomOptionsSection({
  nom,
  selected,
  addable,
  busy,
  onSelect,
  onRemove,
  onAdd,
}: Props) {
  return (
    <>
      <h2 className="nom-section">Options</h2>
      {nom.optionPlaceIds.length === 0 ? (
        <IonText color="medium">
          <p data-testid="nom-no-options">No options yet — add one from your rotation below.</p>
        </IonText>
      ) : (
        <div data-testid="nom-options">
          {nom.optionPlaceIds.map((pid) => (
            <NomOptionCard
              key={pid}
              googlePlaceId={pid}
              actionLabel={nom.selectedPlaceId === pid ? 'Selected ✓' : 'Select'}
              disabled={selected || busy}
              onAction={() => onSelect(pid)}
              secondaryLabel={selected ? undefined : 'Remove'}
              onSecondary={() => onRemove(pid)}
              collapsible
            />
          ))}
        </div>
      )}
      {!selected && addable.length > 0 && (
        <>
          <h2 className="nom-section">Add from your rotation</h2>
          <div data-testid="nom-addable">
            {addable.map((pid) => (
              <NomOptionCard
                key={pid}
                googlePlaceId={pid}
                actionLabel="Add to nom"
                disabled={busy}
                onAction={() => onAdd(pid)}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
