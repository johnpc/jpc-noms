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

/** A nom's display name: its creation date (noms are dated, not titled). */
export function nomDateLabel(nom: Nom): string {
  if (!nom.createdAt) return 'New nom';
  return new Date(nom.createdAt).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/** The current open nom (most recent first), or undefined — where a "➕ Nom"
 * tap lands. When none is open, the caller starts a fresh dated nom. */
export function firstOpenNom(noms: Nom[]): Nom | undefined {
  return noms.find((n) => n.status === 'OPEN');
}

/** Local YYYY-MM-DD for a timestamp (calendar-day key, not UTC). */
function dayKey(iso: string, now: Date): string {
  const d = iso ? new Date(iso) : now;
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * "Today's nom" = a nom CREATED on today's calendar date (local). `now` is
 * injected for determinism. If several exist (edge case), prefer the open one.
 * Returns undefined when nothing was created today — the caller shows the
 * empty/prompt state and lazily creates on first add.
 */
export function todaysNom(noms: Nom[], now: Date): Nom | undefined {
  const key = dayKey('', now);
  const today = noms.filter((n) => n.createdAt && dayKey(n.createdAt, now) === key);
  return today.find((n) => n.status === 'OPEN') ?? today[0];
}

/**
 * The most recent DECIDED nom before today — shown on the Today screen as
 * "last time you picked …" for reference. Ignores today's noms and any without
 * a selection. Sorted by createdAt desc.
 */
export function previousDecidedNom(noms: Nom[], now: Date): Nom | undefined {
  const key = dayKey('', now);
  return noms
    .filter((n) => isSelected(n) && n.createdAt && dayKey(n.createdAt, now) !== key)
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))[0];
}
