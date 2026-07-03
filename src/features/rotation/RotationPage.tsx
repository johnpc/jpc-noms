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
import { useAuth } from '../auth/useAuth';
import { useRotation, useRemoveFromRotation } from './rotationApi';
import { useAddToNom } from '../noms/useAddToNom';
import { RotationItem } from './RotationItem';

/** The signed-in user's saved restaurants. Signed-out users are prompted to sign in. */
export function RotationPage() {
  const { status } = useAuth();
  const { data: entries = [], isLoading } = useRotation(status === 'authenticated');
  const remove = useRemoveFromRotation();
  const nom = useAddToNom();

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
        {status !== 'authenticated' ? (
          <IonText color="medium">
            <p data-testid="rotation-signin">Sign in to save and see your rotation.</p>
          </IonText>
        ) : isLoading ? null : entries.length === 0 ? (
          <IonText color="medium">
            <p data-testid="rotation-empty">
              No favorites yet. Search for a restaurant and add it to your rotation.
            </p>
          </IonText>
        ) : (
          <div data-testid="rotation-list">
            {entries.map((e) => (
              <RotationItem
                key={e.id}
                googlePlaceId={e.googlePlaceId}
                removing={remove.isPending}
                onRemove={() => remove.mutate(e.id)}
                onNom={() => void nom.addToNom(e.googlePlaceId)}
                addingNom={nom.busy}
                nominated={nom.nominatedIds.has(e.googlePlaceId)}
              />
            ))}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}
