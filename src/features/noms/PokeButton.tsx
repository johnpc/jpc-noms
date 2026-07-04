import { IonButton } from '@ionic/react';
import { usePoke } from './usePoke';

/** "Poke your partner" — a nudge push. Only shown once paired. */
export function PokeButton() {
  const p = usePoke();
  if (!p.canPoke) return null;
  return (
    <IonButton
      expand="block"
      fill="outline"
      disabled={p.poking}
      onClick={p.poke}
      data-testid="poke-btn"
    >
      👋 Poke your partner
    </IonButton>
  );
}
