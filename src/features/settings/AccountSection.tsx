import { useState } from 'react';
import {
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonText,
} from '@ionic/react';
import { useAccount } from './useAccount';

/** Account management: identity, change password, sign out, delete. Signed-in only. */
export function AccountSection() {
  const a = useAccount();
  const [oldP, setOldP] = useState('');
  const [newP, setNewP] = useState('');

  if (!a.email) {
    return (
      <IonText color="medium">
        <p data-testid="account-signedout">Sign in to manage your account.</p>
      </IonText>
    );
  }

  return (
    <IonList>
      <IonListHeader>Account</IonListHeader>
      <IonItem lines="none">
        <IonLabel>Signed in as</IonLabel>
        <IonNote slot="end" data-testid="account-email">
          {a.email}
        </IonNote>
      </IonItem>

      <IonItem lines="none">
        <IonInput
          type="password"
          label="Current password"
          labelPlacement="stacked"
          value={oldP}
          onIonInput={(e) => setOldP(e.detail.value ?? '')}
          data-testid="account-oldpw"
        />
      </IonItem>
      <IonItem lines="none">
        <IonInput
          type="password"
          label="New password"
          labelPlacement="stacked"
          value={newP}
          onIonInput={(e) => setNewP(e.detail.value ?? '')}
          data-testid="account-newpw"
        />
      </IonItem>
      <IonButton
        expand="block"
        disabled={a.busy || !oldP || !newP}
        onClick={() => a.changePassword(oldP, newP)}
        data-testid="account-changepw-btn"
      >
        Change password
      </IonButton>

      <IonButton
        expand="block"
        fill="outline"
        disabled={a.busy}
        onClick={a.signOut}
        data-testid="account-signout-btn"
      >
        Sign out
      </IonButton>
      <IonButton
        expand="block"
        color="danger"
        fill="clear"
        disabled={a.busy}
        onClick={a.deleteAccount}
        data-testid="account-delete-btn"
      >
        Delete account
      </IonButton>

      {a.message && (
        <IonText color="success">
          <p data-testid="account-message">{a.message}</p>
        </IonText>
      )}
      {a.error && (
        <IonText color="danger">
          <p data-testid="account-error">{a.error}</p>
        </IonText>
      )}
    </IonList>
  );
}
