import { describe, it, expect } from 'vitest';
import {
  withOption,
  withoutOption,
  pickRandomOption,
  isSelected,
  nomSummary,
  selectedByLabel,
  nomPhase,
} from './nom';
import {
  nomDateLabel,
  nomDateTimeLabel,
  todaysNom,
  todaysOpenNom,
  previousDecidedNom,
  todayState,
} from './nomDates';
import type { Nom } from './types';

const nom = (over: Partial<Nom>): Nom => ({
  id: 'n1',
  pairingId: 'p1',
  members: ['u1', 'u2'],
  optionPlaceIds: [],
  status: 'OPEN',
  ...over,
});

describe('withOption', () => {
  it('appends a new place id', () => {
    expect(withOption(nom({ optionPlaceIds: ['a'] }), 'b')).toEqual(['a', 'b']);
  });
  it('does not duplicate an existing id', () => {
    expect(withOption(nom({ optionPlaceIds: ['a'] }), 'a')).toEqual(['a']);
  });
});

describe('isSelected', () => {
  it('is true only with SELECTED status and a place id', () => {
    expect(isSelected(nom({ status: 'SELECTED', selectedPlaceId: 'a' }))).toBe(true);
    expect(isSelected(nom({ status: 'SELECTED' }))).toBe(false);
    expect(isSelected(nom({ status: 'OPEN', selectedPlaceId: 'a' }))).toBe(false);
  });
});

describe('nomSummary', () => {
  it('summarizes options and selection', () => {
    expect(nomSummary(nom({}))).toBe('No options yet');
    expect(nomSummary(nom({ optionPlaceIds: ['a'] }))).toBe('1 option');
    expect(nomSummary(nom({ optionPlaceIds: ['a', 'b'] }))).toBe('2 options');
    expect(nomSummary(nom({ status: 'SELECTED', selectedPlaceId: 'a' }))).toBe('Selected');
  });
});

describe('withoutOption', () => {
  it('removes the given id and leaves the rest', () => {
    expect(withoutOption(nom({ optionPlaceIds: ['a', 'b', 'c'] }), 'b')).toEqual(['a', 'c']);
  });
  it('is a no-op when the id is absent', () => {
    expect(withoutOption(nom({ optionPlaceIds: ['a'] }), 'z')).toEqual(['a']);
  });
});

describe('pickRandomOption', () => {
  it('picks by the injected fraction (deterministic)', () => {
    const n = nom({ optionPlaceIds: ['a', 'b', 'c'] });
    expect(pickRandomOption(n, 0)).toBe('a');
    expect(pickRandomOption(n, 0.5)).toBe('b');
    expect(pickRandomOption(n, 0.99)).toBe('c');
  });
  it('returns null when there are no options', () => {
    expect(pickRandomOption(nom({ optionPlaceIds: [] }), 0.5)).toBeNull();
  });
});

describe('selectedByLabel', () => {
  it('credits who picked a decided nom', () => {
    const decided = { status: 'SELECTED' as const, selectedPlaceId: 'a' };
    expect(selectedByLabel(nom({ ...decided, selectedBy: 'Emily' }))).toBe('Emily picked this');
    // The credit belongs to a decision — an open nom never shows one.
    expect(selectedByLabel(nom({ selectedBy: 'Emily' }))).toBe('');
  });
  it('is empty when unknown', () => {
    expect(selectedByLabel(nom({}))).toBe('');
  });
});

describe('nomDateLabel', () => {
  it('formats the createdAt date', () => {
    // A fixed ISO date renders a weekday/month/day label (locale-formatted).
    const label = nomDateLabel(nom({ createdAt: '2026-07-03T12:00:00.000Z' }));
    expect(label).toMatch(/Jul/);
    expect(label).toMatch(/3/);
  });
  it('falls back when the date is missing', () => {
    expect(nomDateLabel(nom({ createdAt: null }))).toBe('New nom');
  });
});

describe('nomDateTimeLabel', () => {
  it('includes date + time so same-day noms are distinct', () => {
    const label = nomDateTimeLabel(nom({ createdAt: '2026-07-03T14:05:00' }));
    expect(label).toMatch(/Jul/);
    expect(label).toContain('·');
    expect(label).toMatch(/\d/); // a time component
  });
  it('falls back when the date is missing', () => {
    expect(nomDateTimeLabel(nom({ createdAt: null }))).toBe('New nom');
  });
});

describe('todaysNom', () => {
  const now = new Date('2026-07-03T18:00:00'); // local
  it('returns a nom created today (calendar day)', () => {
    const t = nom({ id: 't', createdAt: '2026-07-03T09:00:00' });
    const old = nom({ id: 'o', createdAt: '2026-07-01T09:00:00' });
    expect(todaysNom([old, t], now)?.id).toBe('t');
  });
  it('shows the MOST RECENT nom today (a fresh open one after a decision)', () => {
    const decided = nom({
      id: 'chelas',
      createdAt: '2026-07-03T17:33:00',
      status: 'SELECTED',
      selectedPlaceId: 'a',
    });
    const freshOpen = nom({ id: 'new', createdAt: '2026-07-03T18:00:00', status: 'OPEN' });
    // started a new nom after deciding → Today shows the new one, not Chela's
    expect(todaysNom([decided, freshOpen], now)?.id).toBe('new');
  });
  it('is undefined when nothing was created today', () => {
    expect(todaysNom([nom({ createdAt: '2026-07-01T09:00:00' })], now)).toBeUndefined();
    expect(todaysNom([], now)).toBeUndefined();
  });
});

describe('todaysOpenNom (➕ Nom target)', () => {
  const now = new Date('2026-07-03T18:00:00');
  it('adds to today’s latest nom while it is still OPEN', () => {
    const openToday = nom({ id: 'o', createdAt: '2026-07-03T12:00:00', status: 'OPEN' });
    const openOld = nom({ id: 'old', createdAt: '2026-07-01T09:00:00', status: 'OPEN' });
    expect(todaysOpenNom([openToday, openOld], now)?.id).toBe('o');
  });
  it('starts a NEW nom (undefined) when today’s latest is already decided', () => {
    const decided = nom({
      id: 'd',
      createdAt: '2026-07-03T17:33:00',
      status: 'SELECTED',
      selectedPlaceId: 'a',
    });
    // this is the "we already picked today, I expected a new one" case
    expect(todaysOpenNom([decided], now)).toBeUndefined();
    expect(todaysOpenNom([], now)).toBeUndefined();
  });
});

describe('previousDecidedNom', () => {
  it('returns the most recent DECIDED nom, excluding the currently-shown one', () => {
    const a = nom({
      id: 'a',
      createdAt: '2026-06-30T12:00:00',
      status: 'SELECTED',
      selectedPlaceId: 'x',
    });
    const b = nom({
      id: 'b',
      createdAt: '2026-07-01T12:00:00',
      status: 'SELECTED',
      selectedPlaceId: 'y',
    });
    // no current → most recent decided
    expect(previousDecidedNom([a, b])?.id).toBe('b');
    // exclude b (today's shown) → falls back to a (an earlier decision)
    expect(previousDecidedNom([a, b], 'b')?.id).toBe('a');
  });
  it('ignores undecided noms', () => {
    const openOld = nom({ id: 'o', createdAt: '2026-07-01T09:00:00', status: 'OPEN' });
    expect(previousDecidedNom([openOld])).toBeUndefined();
  });
});

describe('nomPhase', () => {
  it('is open until status AND place agree', () => {
    expect(nomPhase(nom({}))).toEqual({ kind: 'open' });
    expect(nomPhase(nom({ status: 'SELECTED' }))).toEqual({ kind: 'open' });
    expect(nomPhase(nom({ selectedPlaceId: 'a' }))).toEqual({ kind: 'open' });
  });
  it('is decided with the winning place + a trimmed credit', () => {
    expect(nomPhase(nom({ status: 'SELECTED', selectedPlaceId: 'a', selectedBy: ' Em ' }))).toEqual(
      { kind: 'decided', placeId: 'a', by: 'Em' },
    );
    expect(nomPhase(nom({ status: 'SELECTED', selectedPlaceId: 'a' }))).toEqual({
      kind: 'decided',
      placeId: 'a',
      by: '',
    });
  });
});

describe('todayState', () => {
  const now = new Date('2026-07-03T12:00:00');
  it('is none with nothing created today', () => {
    expect(todayState([nom({ createdAt: '2026-07-01T09:00:00' })], now)).toEqual({ kind: 'none' });
  });
  it('is open / decided from today’s MOST RECENT nom', () => {
    const early = nom({
      id: 'e',
      createdAt: '2026-07-03T08:00:00',
      status: 'SELECTED',
      selectedPlaceId: 'a',
    });
    const late = nom({ id: 'l', createdAt: '2026-07-03T10:00:00' });
    expect(todayState([early, late], now)).toEqual({ kind: 'open', nom: late });
    expect(todayState([early], now)).toEqual({ kind: 'decided', nom: early });
  });
});
