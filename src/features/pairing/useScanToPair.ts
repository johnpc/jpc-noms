import { useAuth } from '../auth/useAuth';
import { usePairByScan } from './pairingApi';
import { scanQr } from './scanner';
import { success } from '../../lib/haptics';
import { useSubmission } from '../../lib/useSubmission';
import { decodePairToken, encodePairToken, type PairToken } from './qrToken';

/**
 * Scan-to-pair flow: my QR token (to display), plus a `scan()` that opens the
 * camera, decodes my partner's code, and creates the ACTIVE pairing. Both apps
 * then update live (Pairing subscription) — "scan and boom". The scan's
 * outcome (cancelled / not ours / failed / paired) is one Submission.
 */
export function useScanToPair() {
  const { sub, email } = useAuth();
  const pair = usePairByScan();
  const { run, fail, busy, error } = useSubmission();

  const me: PairToken | null = sub && email ? { sub, email } : null;
  const myCode = me ? encodePairToken(me) : '';

  const scan = async () => {
    if (!me) return;
    const raw = await scanQr();
    if (!raw) return; // cancelled / no permission / web
    const partner = decodePairToken(raw);
    if (!partner) return fail("That doesn't look like a Noms pairing code.");
    const ok = await run(() => pair.mutateAsync({ me, partner }).then(() => undefined), {
      fallback: 'Pairing failed.',
    });
    if (ok) void success();
  };

  return { myCode, scan, pairing: busy || pair.isPending, error };
}
