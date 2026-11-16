import { IonButton, IonList, IonItem, IonLabel, IonNote } from '@ionic/react';
import { useNomsList } from './useNoms';
import { nomSummary } from './nom';
import { nomDateLabel } from './nomDates';
import { Prompt } from './Prompt';
import { PageShell } from './PageShell';

/** The shared noms list — start a dated nom, or open any to add options / select. */
export function NomsPage() {
  const n = useNomsList();
  const { screen } = n;

  if (screen.kind === 'signed-out')
    return (
      <PageShell title="Our noms">
        {<Prompt testid="noms-signin">Sign in to nominate together.</Prompt>}
      </PageShell>
    );

  return (
    <PageShell title="Our noms">
      <div className="noms-create">
        <IonButton
          expand="block"
          disabled={n.creating}
          onClick={() => n.createNom()}
          data-testid="noms-create-btn"
        >
          Start a nom
        </IonButton>
      </div>
      {!n.paired && (
        <Prompt testid="noms-unpaired">
          Pair with your partner (in “Your partner”) so your noms are shared.
        </Prompt>
      )}
      {screen.kind === 'empty' && (
        <Prompt testid="noms-empty">
          No noms yet. Start one above, or tap “➕ Nom” on any restaurant.
        </Prompt>
      )}
      {screen.kind === 'list' && (
        <IonList data-testid="noms-list">
          {screen.noms.map((nom) => (
            <IonItem key={nom.id} routerLink={`/noms/${nom.id}`} data-testid="nom-row">
              <IonLabel>{nomDateLabel(nom)}</IonLabel>
              <IonNote slot="end">{nomSummary(nom)}</IonNote>
            </IonItem>
          ))}
        </IonList>
      )}
    </PageShell>
  );
}
