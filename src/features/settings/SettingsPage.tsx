import {
  IonButtons,
  IonBackButton,
  IonContent,
  IonHeader,
  IonLabel,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useTheme } from './useTheme';
import { THEME_CHOICES, type ThemeChoice } from './theme';
import { SettingsSection } from './SettingsSection';
import { AccountSection } from './AccountSection';
import { NotificationsSection } from './NotificationsSection';
import { ShareSection } from './ShareSection';
import { SupportSection } from './SupportSection';
import './settings.css';

/** Settings — grouped iOS-style cards: appearance, notifications, share,
 * account, support. Each section is a titled surface card (see settings.css). */
export function SettingsPage() {
  const { choice, setTheme } = useTheme();
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="settings-content ion-padding">
        <SettingsSection title="Appearance">
          <IonSegment
            className="settings-card__segment"
            value={choice}
            onIonChange={(e) => setTheme(e.detail.value as ThemeChoice)}
            data-testid="theme-segment"
          >
            {THEME_CHOICES.map((c) => (
              <IonSegmentButton key={c} value={c} data-testid={`theme-${c}`}>
                <IonLabel>{c[0].toUpperCase() + c.slice(1)}</IonLabel>
              </IonSegmentButton>
            ))}
          </IonSegment>
        </SettingsSection>
        <NotificationsSection />
        <ShareSection />
        <AccountSection />
        <SupportSection />
      </IonContent>
    </IonPage>
  );
}
