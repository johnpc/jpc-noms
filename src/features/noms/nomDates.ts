/** Pure date/selection helpers for noms — no I/O, unit-tested. Split from nom.ts
 * to keep each file within the line budget. */
import type { Nom } from './types';
import { isSelected } from './nom';

/** A nom's display name: its creation date (noms are dated, not titled). */
export function nomDateLabel(nom: Nom): string {
  if (!nom.createdAt) return 'New nom';
  return new Date(nom.createdAt).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/** Date + time — used in history where several noms can share a day (2 picks
 * seconds apart shouldn't look like one garbled row). Falls back to the date. */
export function nomDateTimeLabel(nom: Nom): string {
  if (!nom.createdAt) return 'New nom';
  const d = new Date(nom.createdAt);
  const date = d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${date} · ${time}`;
}

/** Local calendar-day key for a timestamp (not UTC). */
function dayKey(iso: string, now: Date): string {
  const d = iso ? new Date(iso) : now;
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

const byCreatedDesc = (a: Nom, b: Nom): number =>
  (b.createdAt ?? '').localeCompare(a.createdAt ?? '');

/** Noms created on today's calendar date (local), most-recent first. */
function todaysNoms(noms: Nom[], now: Date): Nom[] {
  const key = dayKey('', now);
  return noms.filter((n) => n.createdAt && dayKey(n.createdAt, now) === key).sort(byCreatedDesc);
}

/**
 * "Today's nom" = the nom for today's calendar date. Once you've DECIDED today,
 * that decided nom is what you want to see (not a leftover empty shortlist), so
 * prefer the most recent SELECTED; else the most recent OPEN one. Undefined when
 * nothing was created today — caller shows the prompt + lazily creates on add.
 */
export function todaysNom(noms: Nom[], now: Date): Nom | undefined {
  const today = todaysNoms(noms, now);
  return today.find(isSelected) ?? today[0];
}

/** Today's OPEN (not-yet-decided) nom — where a "➕ Nom" tap adds. When none
 * exists today, the caller creates one; this scopes find-or-create to TODAY so
 * we don't reuse a stale open nom from a past day OR spawn duplicates. */
export function todaysOpenNom(noms: Nom[], now: Date): Nom | undefined {
  return todaysNoms(noms, now).find((n) => n.status === 'OPEN');
}

/**
 * The most recent DECIDED nom to show as "last time you picked …", EXCLUDING the
 * nom currently shown as today's (so it's genuinely the prior decision — an
 * earlier one today, or a previous day). `currentId` is today's shown nom's id.
 */
export function previousDecidedNom(noms: Nom[], currentId?: string): Nom | undefined {
  return noms.filter((n) => isSelected(n) && n.id !== currentId).sort(byCreatedDesc)[0];
}
