/**
 * Pure screen derivations for the noms pages — each page renders by switching
 * on ONE discriminated union instead of nesting `!signedIn ? … : loading ? …`
 * ternaries. Signed-out / loading come from the shared gate; the rest is
 * per-page. No I/O, unit-tested.
 */
import { screenGate, type GateScreen } from '../../lib/screenGate';
import { nomPhase } from './nom';
import { todayState } from './nomDates';
import type { Nom } from './types';

// @state-machine today-screen
export type TodayScreen =
  GateScreen | { kind: 'empty' } | { kind: 'open'; nom: Nom } | { kind: 'decided'; nom: Nom };

/** Today: a nom with no options yet reads as empty — it exists only as the
 * invisible add-target until the first "➕ Nom" lands. */
export function todayScreen(
  signedIn: boolean,
  loading: boolean,
  noms: Nom[],
  now: Date,
): TodayScreen {
  const gate = screenGate(signedIn, loading);
  if (gate) return gate;
  const today = todayState(noms, now);
  if (today.kind === 'none' || today.nom.optionPlaceIds.length === 0) return { kind: 'empty' };
  return today;
}

// @state-machine nom-detail-screen
export type NomDetailScreen =
  GateScreen | { kind: 'missing' } | { kind: 'open'; nom: Nom } | { kind: 'decided'; nom: Nom };

/** Detail: an id not in the live list (deleted by a partner, stale link) is
 * `missing` — a real state with its own message, not a blank page. */
export function nomDetailScreen(
  signedIn: boolean,
  loading: boolean,
  nom: Nom | undefined,
): NomDetailScreen {
  const gate = screenGate(signedIn, loading);
  if (gate) return gate;
  if (!nom) return { kind: 'missing' };
  return { kind: nomPhase(nom).kind, nom };
}

// @state-machine noms-list-screen
export type NomsListScreen = GateScreen | { kind: 'empty' } | { kind: 'list'; noms: Nom[] };

export function nomsListScreen(signedIn: boolean, loading: boolean, noms: Nom[]): NomsListScreen {
  const gate = screenGate(signedIn, loading);
  if (gate) return gate;
  return noms.length === 0 ? { kind: 'empty' } : { kind: 'list', noms };
}
