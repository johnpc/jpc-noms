/** Pure stats derivation from the shared noms — no I/O, unit-tested. */
import type { Nom } from '../noms/types';

export interface NomStats {
  totalNoms: number;
  decidedCount: number;
  openCount: number;
  /** Selected noms, most-recent-ish first (input order reversed), for a history list. */
  history: Nom[];
}

const isDecided = (n: Nom): boolean => n.status === 'SELECTED' && !!n.selectedPlaceId;

/** Summarize a list of noms into counts + a decided-history list. */
export function computeNomStats(noms: Nom[]): NomStats {
  const decided = noms.filter(isDecided);
  return {
    totalNoms: noms.length,
    decidedCount: decided.length,
    openCount: noms.length - decided.length,
    history: [...decided].reverse(),
  };
}
