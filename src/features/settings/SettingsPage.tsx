import {
  IonButtons,
  IonBackButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useTheme } from './useTheme';
import { THEME_CHOICES, type ThemeChoice } from './theme';

/** Settings — appearance (light/dark/system) today; grows as needed. */
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
      <IonContent className="ion-padding">
        <IonList>
          <IonListHeader>Appearance</IonListHeader>
          <IonItem lines="none">
            <IonLabel>Theme</IonLabel>
            <IonSegment
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
          </IonItem>
        </IonList>
      </IonContent>
    </IonPage>
  );
}
