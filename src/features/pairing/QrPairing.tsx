import { IonButton, IonText } from '@ionic/react';
import { QrCode } from './QrCode';
import { useScanToPair } from './useScanToPair';
import './pairing.css';

/**
 * The frictionless pairing UI: show my QR, or scan my partner's. Either scan
 * connects both instantly. Shown in every not-yet-active pairing state.
 */
export function QrPairing() {
  const s = useScanToPair();
  return (
    <div className="qr-pairing" data-testid="qr-pairing">
      <IonText>
        <p className="qr-pairing__lead">Point one phone at the other to connect — instantly.</p>
      </IonText>
      <QrCode value={s.myCode} />
      <IonButton expand="block" disabled={s.pairing} onClick={s.scan} data-testid="qr-scan-btn">
        {s.pairing ? 'Connecting…' : "Scan partner's code"}
      </IonButton>
      {s.error && (
        <IonText color="danger">
          <p data-testid="qr-error">{s.error}</p>
        </IonText>
      )}
    </div>
  );
}
