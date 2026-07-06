import { IonButton, IonItem, IonLabel, IonNote } from '@ionic/react';
import { SettingsSection } from './SettingsSection';
import { useNotifications } from './useNotifications';

const LABEL: Record<string, string> = {
  on: 'On',
  off: 'Off',
  prompt: 'Off',
  denied: 'Blocked in iOS',
  web: 'iOS app only',
};

/**
 * Push-notifications control. Shows the current state and the right action:
 * On → Turn off (in-app opt-out; removes this device's token), Off/prompt →
 * Turn on (register / fire the prompt), Blocked → Open iOS Settings (the app
 * can't re-prompt once iOS denied). Hidden on web (push is iOS-only).
 */
export function NotificationsSection() {
  const n = useNotifications();
  if (n.state === 'web') return null;

  return (
    <SettingsSection title="Notifications">
      <IonItem lines="none">
        <IonLabel>Partner activity</IonLabel>
        <IonNote slot="end" data-testid="notif-status">
          {LABEL[n.state]}
        </IonNote>
      </IonItem>
      {n.state === 'on' && (
        <IonButton
          expand="block"
          fill="clear"
          color="medium"
          disabled={n.working}
          onClick={() => void n.disable()}
          data-testid="notif-disable"
        >
          Turn off
        </IonButton>
      )}
      {(n.state === 'off' || n.state === 'prompt') && (
        <IonButton
          expand="block"
          fill="clear"
          disabled={n.working}
          onClick={() => void n.enable()}
          data-testid="notif-enable"
        >
          Turn on notifications
        </IonButton>
      )}
      {n.state === 'denied' && (
        <IonButton
          expand="block"
          fill="clear"
          onClick={n.openIosSettings}
          data-testid="notif-open-settings"
        >
          Open iOS Settings
        </IonButton>
      )}
      {/* Explicit manual register — forces the permission→APNs→save flow and
          shows the result below, for when auto-registration didn't land a token. */}
      <IonButton
        expand="block"
        fill="outline"
        disabled={n.working}
        onClick={() => void n.enable()}
        data-testid="notif-register"
      >
        {n.working ? 'Registering…' : 'Register this device'}
      </IonButton>
      {n.lastError && (
        <IonItem lines="none">
          <IonNote className="notif-error" data-testid="notif-error">
            Last push issue: {n.lastError}
          </IonNote>
        </IonItem>
      )}
    </SettingsSection>
  );
}
