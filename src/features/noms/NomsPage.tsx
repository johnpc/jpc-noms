import {
  IonButton,
  IonButtons,
  IonBackButton,
  IonContent,
  IonHeader,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useNomsList } from './useNoms';
import { nomSummary } from './nom';
import { nomDateLabel } from './nomDates';
import { Prompt } from './Prompt';

/** The shared noms list — start a dated nom, or open any to add options / select. */
export function NomsPage() {
  const n = useNomsList();

  if (!n.signedIn)
    return <Shell body={<Prompt testid="noms-signin">Sign in to nominate together.</Prompt>} />;

  return (
    <Shell
      body={
        <>
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
          {n.noms.length === 0 ? (
            <Prompt testid="noms-empty">
              No noms yet. Start one above, or tap “➕ Nom” on any restaurant.
            </Prompt>
          ) : (
            <IonList data-testid="noms-list">
              {n.noms.map((nom) => (
                <IonItem key={nom.id} routerLink={`/noms/${nom.id}`} data-testid="nom-row">
                  <IonLabel>{nomDateLabel(nom)}</IonLabel>
                  <IonNote slot="end">{nomSummary(nom)}</IonNote>
                </IonItem>
              ))}
            </IonList>
          )}
        </>
      }
    />
  );
}

function Shell({ body }: { body: React.ReactNode }) {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Our noms</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">{body}</IonContent>
    </IonPage>
  );
}
