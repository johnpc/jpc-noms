import { IonItem, IonLabel, IonNote } from '@ionic/react';
import { SettingsSection } from './SettingsSection';
import { showToast } from '../../lib/toast';

/** The App Store link for the app (ships through the jpc.eats listing). */
export const APP_STORE_URL = 'https://apps.apple.com/app/id6502933152';

/** "Share app" — copies the App Store URL to the clipboard so you can send it
 * to someone. Best-effort clipboard (WKWebView + web support navigator.clipboard). */
export function ShareSection() {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(APP_STORE_URL);
      void showToast('Link copied 📋');
    } catch {
      void showToast(APP_STORE_URL); // fallback: show it so they can copy manually
    }
  };
  return (
    <SettingsSection title="Share">
      <IonItem lines="none" button detail onClick={() => void copy()} data-testid="share-app">
        <IonLabel>Share app</IonLabel>
        <IonNote slot="end">Copy link</IonNote>
      </IonItem>
    </SettingsSection>
  );
}
