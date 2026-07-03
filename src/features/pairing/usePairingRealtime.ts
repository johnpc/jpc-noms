import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { dataClient } from '../../lib/dataClient';

/**
 * Keeps the ['pairing'] cache live: when a Pairing the caller belongs to is
 * created/updated (e.g. their partner just scanned their QR and paired), refresh
 * so BOTH apps reflect the connection instantly. No-op until signed in.
 */
export function usePairingRealtime(enabled: boolean): void {
  const qc = useQueryClient();
  useEffect(() => {
    if (!enabled) return;
    const bump = () => qc.invalidateQueries({ queryKey: ['pairing'] });
    const created = dataClient.models.Pairing.onCreate({ authMode: 'userPool' }).subscribe({
      next: bump,
      error: () => {},
    });
    const updated = dataClient.models.Pairing.onUpdate({ authMode: 'userPool' }).subscribe({
      next: bump,
      error: () => {},
    });
    const deleted = dataClient.models.Pairing.onDelete({ authMode: 'userPool' }).subscribe({
      next: bump,
      error: () => {},
    });
    return () => {
      created.unsubscribe();
      updated.unsubscribe();
      deleted.unsubscribe();
    };
  }, [enabled, qc]);
}
