/** Pure nom-state helpers — no I/O, unit-tested. */
import type { Nom } from './types';

/** Add a place id to a nom's options (no duplicates). Returns the next list. */
export function withOption(nom: Nom, placeId: string): string[] {
  return nom.optionPlaceIds.includes(placeId)
    ? nom.optionPlaceIds
    : [...nom.optionPlaceIds, placeId];
}

/** True once a nom has a real selection. */
export function isSelected(nom: Nom): boolean {
  return nom.status === 'SELECTED' && !!nom.selectedPlaceId;
}

/** Short summary line for a nom card. */
export function nomSummary(nom: Nom): string {
  if (isSelected(nom)) return 'Selected';
  const n = nom.optionPlaceIds.length;
  return n === 0 ? 'No options yet' : `${n} option${n === 1 ? '' : 's'}`;
}
