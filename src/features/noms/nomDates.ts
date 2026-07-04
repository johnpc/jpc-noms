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
 * "Today's nom" = the MOST RECENT nom created today — whatever you last touched,
 * open or decided. Showing the latest matches expectation: after you decide,
 * you see the decision; after you start a fresh one, you see that. Undefined
 * when nothing was created today (caller shows the prompt + lazy-creates on add).
 */
export function todaysNom(noms: Nom[], now: Date): Nom | undefined {
  return todaysNoms(noms, now)[0];
}

/**
 * Where a "➕ Nom" tap adds: today's most-recent nom IF it's still OPEN. If
 * today's latest is already DECIDED (or there's none today), returns undefined
 * so the caller creates a NEW nom — starting a fresh, visible nom rather than
 * re-opening a decision. This keeps the add-target and what Today shows in sync.
 */
export function todaysOpenNom(noms: Nom[], now: Date): Nom | undefined {
  const latest = todaysNoms(noms, now)[0];
  return latest && !isSelected(latest) ? latest : undefined;
}

/**
 * The most recent DECIDED nom to show as "last time you picked …", EXCLUDING the
 * nom currently shown as today's (so it's genuinely the prior decision — an
 * earlier one today, or a previous day). `currentId` is today's shown nom's id.
 */
export function previousDecidedNom(noms: Nom[], currentId?: string): Nom | undefined {
  return noms.filter((n) => isSelected(n) && n.id !== currentId).sort(byCreatedDesc)[0];
}
