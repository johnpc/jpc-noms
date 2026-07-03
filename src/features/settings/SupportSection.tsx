import { IonItem, IonLabel, IonList, IonListHeader, IonNote } from '@ionic/react';

/** Where to email for help. */
export const SUPPORT_EMAIL = 'john@johncorser.com';

/** Support contact — a tappable mailto, like the reference app. */
export function SupportSection() {
  return (
    <IonList>
      <IonListHeader>Support</IonListHeader>
      <IonItem
        href={`mailto:${SUPPORT_EMAIL}?subject=Noms%20support`}
        detail
        data-testid="support-email"
      >
        <IonLabel>Email support</IonLabel>
        <IonNote slot="end">{SUPPORT_EMAIL}</IonNote>
      </IonItem>
    </IonList>
  );
}
