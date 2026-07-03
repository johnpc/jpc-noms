import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { dataClient } from '../../lib/dataClient';

/**
 * Wire Amplify subscriptions into the react-query cache so a partner's edit to
 * a shared nom appears live (dev-philosophy: subscriptions → queryClient). When
 * either partner creates/updates a Nom, we invalidate ['noms'] to refetch.
 * No-op until signed in (owner-auth subscriptions need a userPool session).
 */
export function useNomsRealtime(enabled: boolean): void {
  const qc = useQueryClient();
  useEffect(() => {
    if (!enabled) return;
    const bump = () => qc.invalidateQueries({ queryKey: ['noms'] });
    const created = dataClient.models.Nom.onCreate({ authMode: 'userPool' }).subscribe({
      next: bump,
      error: () => {},
    });
    const updated = dataClient.models.Nom.onUpdate({ authMode: 'userPool' }).subscribe({
      next: bump,
      error: () => {},
    });
    return () => {
      created.unsubscribe();
      updated.unsubscribe();
    };
  }, [enabled, qc]);
}
