/** Pure nom-state helpers — no I/O, unit-tested. */
import type { Nom } from './types';

/** Add a place id to a nom's options (no duplicates). Returns the next list. */
export function withOption(nom: Nom, placeId: string): string[] {
  return nom.optionPlaceIds.includes(placeId)
    ? nom.optionPlaceIds
    : [...nom.optionPlaceIds, placeId];
}

/** Remove a place id from a nom's options. Returns the next list. */
export function withoutOption(nom: Nom, placeId: string): string[] {
  return nom.optionPlaceIds.filter((id) => id !== placeId);
}

/** Pick one option at random. `rand` in [0,1) is injected for determinism. */
export function pickRandomOption(nom: Nom, rand: number): string | null {
  const opts = nom.optionPlaceIds;
  if (opts.length === 0) return null;
  return opts[Math.floor(rand * opts.length)] ?? opts[opts.length - 1];
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

/** "Emily picked this" style credit for the selected banner, or '' if unknown. */
export function selectedByLabel(nom: Nom): string {
  const who = nom.selectedBy?.trim();
  return who ? `${who} picked this` : '';
}

// Date + "today's nom" selection helpers live in ./nomDates.ts (line budget).
