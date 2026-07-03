import {
  IonButton,
  IonButtons,
  IonBackButton,
  IonContent,
  IonHeader,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';

/** TestFlight beta link for iOS. */
export const TESTFLIGHT_URL = 'https://testflight.apple.com/join/txYqP8XG';

/** Get-the-app page: iOS TestFlight beta + install-as-PWA guidance. */
export function DownloadPage() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Get the app</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonText>
          <h2>iOS (TestFlight)</h2>
          <p>Join the beta and install Noms on your iPhone.</p>
        </IonText>
        <IonButton
          expand="block"
          href={TESTFLIGHT_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="download-testflight"
        >
          Join the TestFlight beta
        </IonButton>
        <IonText color="medium">
          <h2>Any device (PWA)</h2>
          <p>
            Open Noms in your browser, then use <em>Share → Add to Home Screen</em> to install it
            like a native app — offline-capable and full-screen.
          </p>
        </IonText>
      </IonContent>
    </IonPage>
  );
}
