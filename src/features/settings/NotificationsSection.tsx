import { IonButton, IonItem, IonLabel, IonList, IonListHeader, IonNote } from '@ionic/react';
import { useNotifications } from './useNotifications';

const LABEL: Record<string, string> = {
  granted: 'On',
  denied: 'Blocked in iOS',
  prompt: 'Off',
  web: 'iOS app only',
};

/**
 * Push-notifications control: shows the current permission and the right action
 * — enable it (prompt + register) when off, or a link to iOS Settings when the
 * user previously blocked it (the app can't re-prompt then). Hidden on web,
 * where push isn't available.
 */
export function NotificationsSection() {
  const n = useNotifications();
  if (n.status === 'web') return null;

  return (
    <IonList>
      <IonListHeader>Notifications</IonListHeader>
      <IonItem>
        <IonLabel>Partner activity</IonLabel>
        <IonNote slot="end" data-testid="notif-status">
          {LABEL[n.status]}
        </IonNote>
      </IonItem>
      {n.status === 'prompt' && (
        <IonButton
          expand="block"
          fill="clear"
          disabled={n.working}
          onClick={() => void n.enable()}
          data-testid="notif-enable"
        >
          Enable notifications
        </IonButton>
      )}
      {n.status === 'denied' && (
        <IonButton
          expand="block"
          fill="clear"
          onClick={n.openIosSettings}
          data-testid="notif-open-settings"
        >
          Open iOS Settings
        </IonButton>
      )}
    </IonList>
  );
}
