import { IonText } from '@ionic/react';
import { useParams } from 'react-router-dom';
import { useNomDetail } from './useNomDetail';
import { NomOptionsSection } from './NomOptionsSection';
import { NomFooterActions } from './NomFooterActions';
import { NomShell } from './NomShell';
import { isSelected, selectedByLabel } from './nom';

/** One shared nom: its options (either partner can select) + your rotation to add from. */
export function NomDetail() {
  const { id } = useParams<{ id: string }>();
  const d = useNomDetail(id);

  if (!d.signedIn || d.loading || !d.nom) {
    return (
      <NomShell title="Nom">
        {!d.signedIn && <p data-testid="nom-signin">Sign in to view this nom.</p>}
      </NomShell>
    );
  }
  const nom = d.nom;
  const selected = isSelected(nom);

  return (
    <NomShell title={nom.title || 'Nom'}>
      {selected && (
        <IonText color="success">
          <p data-testid="nom-selected">
            Selected — navigation sent to the car 🚗
            {selectedByLabel(nom) && (
              <span data-testid="nom-selected-by"> · {selectedByLabel(nom)}</span>
            )}
          </p>
        </IonText>
      )}
      <NomOptionsSection
        nom={nom}
        selected={selected}
        addable={d.addable}
        busy={d.busy}
        onSelect={d.select}
        onRemove={d.remove}
        onAdd={d.add}
      />
      <NomFooterActions
        selected={selected}
        hasOptions={nom.optionPlaceIds.length > 0}
        busy={d.busy}
        onDecide={d.decideForUs}
        onReopen={d.reopen}
        onDelete={d.del}
      />
    </NomShell>
  );
}
