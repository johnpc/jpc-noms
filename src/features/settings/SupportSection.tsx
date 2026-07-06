import { IonItem, IonLabel, IonNote } from '@ionic/react';
import { SettingsSection } from './SettingsSection';

/** Where to email for help. */
export const SUPPORT_EMAIL = 'john@johncorser.com';

/** Support contact — a tappable mailto, like the reference app. */
export function SupportSection() {
  return (
    <SettingsSection title="Support">
      <IonItem
        lines="none"
        href={`mailto:${SUPPORT_EMAIL}?subject=Noms%20support`}
        detail
        data-testid="support-email"
      >
        <IonLabel>Email support</IonLabel>
        <IonNote slot="end">{SUPPORT_EMAIL}</IonNote>
      </IonItem>
    </SettingsSection>
  );
}
