import { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { usePairByScan } from './pairingApi';
import { scanQr } from './scanner';
import { success } from '../../lib/haptics';
import { decodePairToken, encodePairToken, type PairToken } from './qrToken';

/**
 * Scan-to-pair flow: my QR token (to display), plus a `scan()` that opens the
 * camera, decodes my partner's code, and creates the ACTIVE pairing. Both apps
 * then update live (Pairing subscription) — "scan and boom".
 */
export function useScanToPair() {
  const { sub, email } = useAuth();
  const pair = usePairByScan();
  const [error, setError] = useState<string | null>(null);

  const me: PairToken | null = sub && email ? { sub, email } : null;
  const myCode = me ? encodePairToken(me) : '';

  const scan = async () => {
    setError(null);
    if (!me) return;
    const raw = await scanQr();
    if (!raw) return; // cancelled / no permission / web
    const partner = decodePairToken(raw);
    if (!partner) {
      setError("That doesn't look like a Noms pairing code.");
      return;
    }
    try {
      await pair.mutateAsync({ me, partner });
      void success();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Pairing failed.');
    }
  };

  return { myCode, scan, pairing: pair.isPending, error };
}
