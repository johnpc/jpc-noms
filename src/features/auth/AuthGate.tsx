import { IonContent, IonPage, IonSpinner } from '@ionic/react';
import { useAuth } from './useAuth';

/**
 * Holds the app on a splash until the Cognito session resolves. Without this,
 * the tree renders the signed-OUT UI first and flips to signed-in a second or
 * two later once currentEmail() returns — a jarring flash. Gating on the
 * existing 'loading' status shows a neutral splash instead.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  if (status === 'loading') {
    return (
      <IonPage>
        <IonContent
          className="ion-padding ion-flex ion-justify-content-center ion-align-items-center"
          data-testid="auth-gate"
        >
          <IonSpinner name="crescent" />
        </IonContent>
      </IonPage>
    );
  }
  return <>{children}</>;
}
