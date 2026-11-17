/** Pure date/selection helpers for noms — no I/O, unit-tested. Split from nom.ts
 * to keep each file within the line budget. */
import type { Nom } from './types';
import { isSelected } from './nom';

// @state-machine today-nom

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

/**
 * What "today" holds, derived once: nothing created today, today's MOST RECENT
 * nom still open, or that nom already decided. Showing the latest matches
 * expectation — after you decide you see the decision; after you start a fresh
 * one you see that. Today's screen AND the "➕ Nom" add-target both read this,
 * so what Today shows and where an add lands can never disagree.
 */
export type TodayState =
  { kind: 'none' } | { kind: 'open'; nom: Nom } | { kind: 'decided'; nom: Nom };

export function todayState(noms: Nom[], now: Date): TodayState {
  const key = dayKey('', now);
  const latest = noms
    .filter((n) => n.createdAt && dayKey(n.createdAt, now) === key)
    .sort(byCreatedDesc)[0];
  if (!latest) return { kind: 'none' };
  return isSelected(latest) ? { kind: 'decided', nom: latest } : { kind: 'open', nom: latest };
}

/** Today's shown nom (open or decided), or undefined when nothing was created today. */
export function todaysNom(noms: Nom[], now: Date): Nom | undefined {
  const t = todayState(noms, now);
  return t.kind === 'none' ? undefined : t.nom;
}

/**
 * Where a "➕ Nom" tap adds: today's nom only while it is still OPEN. Decided
 * (or none today) → undefined, so the caller starts a NEW nom rather than
 * re-opening a decision.
 */
export function todaysOpenNom(noms: Nom[], now: Date): Nom | undefined {
  const t = todayState(noms, now);
  return t.kind === 'open' ? t.nom : undefined;
}

/**
 * The most recent DECIDED nom to show as "last time you picked …", EXCLUDING the
 * nom currently shown as today's (so it's genuinely the prior decision — an
 * earlier one today, or a previous day). `currentId` is today's shown nom's id.
 */
export function previousDecidedNom(noms: Nom[], currentId?: string): Nom | undefined {
  return noms.filter((n) => isSelected(n) && n.id !== currentId).sort(byCreatedDesc)[0];
}
