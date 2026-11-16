/** Pure stats derivation from the shared noms — no I/O, unit-tested. */
import type { Nom } from '../noms/types';
import { isSelected } from '../noms/nom';

export interface NomStats {
  totalNoms: number;
  decidedCount: number;
  openCount: number;
  /** Decided noms in reverse-chronological order (newest first) for the history list. */
  history: Nom[];
}

/** Summarize a list of noms into counts + a decided-history list. */
export function computeNomStats(noms: Nom[]): NomStats {
  const decided = noms.filter(isSelected);
  return {
    totalNoms: noms.length,
    decidedCount: decided.length,
    openCount: noms.length - decided.length,
    // Sort by createdAt desc so history is reliably newest-first, regardless of
    // the order Nom.list returned (which isn't guaranteed chronological).
    history: [...decided].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')),
  };
}
