import {
  IonButtons,
  IonBackButton,
  IonContent,
  IonHeader,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useRotationPage } from './useRotationPage';
import { RotationItem } from './RotationItem';

/** The signed-in user's saved restaurants. Signed-out users are prompted to sign in. */
export function RotationPage() {
  const r = useRotationPage();
  const { screen } = r;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Your rotation</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {screen.kind === 'signed-out' && (
          <IonText color="medium">
            <p data-testid="rotation-signin">Sign in to save and see your rotation.</p>
          </IonText>
        )}
        {screen.kind === 'empty' && (
          <IonText color="medium">
            <p data-testid="rotation-empty">
              No favorites yet. Search for a restaurant and add it to your rotation.
            </p>
          </IonText>
        )}
        {screen.kind === 'list' && (
          <div data-testid="rotation-list">
            {screen.entries.map((e) => (
              <RotationItem
                key={e.id}
                googlePlaceId={e.googlePlaceId}
                removing={r.removing}
                onRemove={() => r.remove(e.id)}
                onNom={() => r.addToNom(e.googlePlaceId)}
                addingNom={r.addingNom}
                nominated={r.nominatedIds.has(e.googlePlaceId)}
              />
            ))}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}
