import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { dataClient } from '../../lib/dataClient';
import { nomFromRecord, upsertNom, removeNom } from './nomRecord';
import type { Nom } from './types';

/**
 * Wire Amplify subscriptions into the react-query cache so a partner's edit to
 * a shared nom appears INSTANTLY — we apply the changed row straight into the
 * ['noms'] cache via setQueryData (no refetch round-trip), per dev-philosophy.
 * No-op until signed in (owner-auth subscriptions need a userPool session).
 */
export function useNomsRealtime(enabled: boolean): void {
  const qc = useQueryClient();
  useEffect(() => {
    if (!enabled) return;
    const apply = (raw: Record<string, unknown>) => {
      const nom = nomFromRecord(raw);
      qc.setQueryData<Nom[]>(['noms'], (list) => upsertNom(list, nom));
    };
    const created = dataClient.models.Nom.onCreate({ authMode: 'userPool' }).subscribe({
      next: apply,
      error: () => {},
    });
    const updated = dataClient.models.Nom.onUpdate({ authMode: 'userPool' }).subscribe({
      next: apply,
      error: () => {},
    });
    const deleted = dataClient.models.Nom.onDelete({ authMode: 'userPool' }).subscribe({
      next: (raw: Record<string, unknown>) =>
        qc.setQueryData<Nom[]>(['noms'], (list) => removeNom(list, String(raw.id))),
      error: () => {},
    });
    return () => {
      created.unsubscribe();
      updated.unsubscribe();
      deleted.unsubscribe();
    };
  }, [enabled, qc]);
}
