import {
  IonButton,
  IonButtons,
  IonBackButton,
  IonContent,
  IonHeader,
  IonInput,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { usePairingFlow } from './usePairing';
import { QrPairing } from './QrPairing';
import { PokeButton } from '../noms/PokeButton';
import './pairing.css';

/** Fixed partner pairing: scan to connect (primary), or invite by email. */
export function PairingPage() {
  const p = usePairingFlow();
  const view = p.view; // local so TS narrows the discriminated union across branches
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Your partner</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {!p.signedIn ? (
          <IonText color="medium">
            <p data-testid="pairing-signin">Sign in to pair with your partner.</p>
          </IonText>
        ) : p.loading ? null : view.kind === 'active' ? (
          <>
            <IonText>
              <p data-testid="pairing-active">Paired with {view.partnerEmail} 🎉</p>
            </IonText>
            <PokeButton />
            <IonButton
              expand="block"
              fill="clear"
              color="danger"
              disabled={p.unpairing}
              onClick={() => p.unpair(view.pairingId)}
              data-testid="pairing-unpair-btn"
            >
              Unpair
            </IonButton>
          </>
        ) : (
          <>
            {/* Primary path: scan to connect — works from any unpaired state. */}
            <QrPairing />

            {view.kind === 'pending-received' && (
              <div data-testid="pairing-received">
                <p>{view.partnerEmail} invited you by email.</p>
                <IonButton
                  disabled={p.accepting}
                  onClick={() => p.accept(view.pairingId)}
                  data-testid="pairing-accept-btn"
                >
                  Accept invite
                </IonButton>
              </div>
            )}
            {view.kind === 'pending-sent' && (
              <IonText color="medium">
                <p data-testid="pairing-sent">Invite sent to {view.partnerEmail}.</p>
              </IonText>
            )}

            <p className="pairing-divider">— or invite by email —</p>
            <div data-testid="pairing-invite">
              <IonInput
                type="email"
                label="Partner's email"
                labelPlacement="stacked"
                value={p.inviteEmail}
                onIonInput={(e) => p.setInviteEmail(e.detail.value ?? '')}
                data-testid="pairing-email"
              />
              <IonButton disabled={p.inviting} onClick={p.invite} data-testid="pairing-invite-btn">
                Send invite
              </IonButton>
            </div>
          </>
        )}
      </IonContent>
    </IonPage>
  );
}
