/** Pure mapping + cache helpers for noms — no I/O, unit-tested. */
import type { Nom } from './types';

/** Map a raw Amplify record (list row or subscription payload) to a Nom. */
export function nomFromRecord(r: Record<string, unknown>): Nom {
  return {
    id: r.id as string,
    pairingId: r.pairingId as string,
    members: (r.members as string[]) ?? [],
    title: (r.title as string | null) ?? null,
    optionPlaceIds: ((r.optionPlaceIds as (string | null)[]) ?? []).filter((x): x is string => !!x),
    selectedPlaceId: (r.selectedPlaceId as string | null) ?? null,
    selectedBy: (r.selectedBy as string | null) ?? null,
    status: r.status as Nom['status'],
  };
}

/**
 * Upsert a nom into a list by id (replace if present, else prepend) — the pure
 * core of the subscription's setQueryData so a partner's change lands instantly
 * without a refetch.
 */
export function upsertNom(list: Nom[] | undefined, nom: Nom): Nom[] {
  const current = list ?? [];
  const idx = current.findIndex((n) => n.id === nom.id);
  if (idx === -1) return [nom, ...current];
  const next = current.slice();
  next[idx] = nom;
  return next;
}
