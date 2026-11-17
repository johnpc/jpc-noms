import { IonText } from '@ionic/react';
import { useParams } from 'react-router-dom';
import { useNomDetail } from './useNomDetail';
import { NomOptionsSection } from './NomOptionsSection';
import { NomFooterActions } from './NomFooterActions';
import { PageShell } from './PageShell';
import { Prompt } from './Prompt';
import { selectedByLabel } from './nom';
import { nomDateLabel } from './nomDates';

/** One shared nom: its options (either partner can select) + your rotation to add from. */
export function NomDetail() {
  const { id } = useParams<{ id: string }>();
  const d = useNomDetail(id);
  const { screen } = d;

  if (screen.kind === 'signed-out' || screen.kind === 'loading' || screen.kind === 'missing') {
    return (
      <PageShell title="Nom" backHref="/noms">
        {screen.kind === 'signed-out' && (
          <Prompt testid="nom-signin">Sign in to view this nom.</Prompt>
        )}
        {screen.kind === 'missing' && (
          <Prompt testid="nom-missing">This nom is gone — it may have been deleted.</Prompt>
        )}
      </PageShell>
    );
  }
  const { nom } = screen;
  const selected = screen.kind === 'decided';

  return (
    <PageShell title={nomDateLabel(nom)} backHref="/noms">
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
    </PageShell>
  );
}
