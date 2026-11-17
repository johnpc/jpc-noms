import { describe, it, expect } from 'vitest';
import { nomDetailScreen, nomsListScreen, todayScreen } from './nomScreens';
import type { Nom } from './types';

const now = new Date('2026-07-03T12:00:00');
const nom = (over: Partial<Nom>): Nom => ({
  id: 'n',
  pairingId: 'p',
  members: ['u1'],
  createdAt: '2026-07-03T09:00:00',
  optionPlaceIds: ['a'],
  status: 'OPEN',
  ...over,
});

describe('todayScreen', () => {
  it('gates on signed-out then loading', () => {
    expect(todayScreen(false, false, [], now)).toEqual({ kind: 'signed-out' });
    expect(todayScreen(true, true, [], now)).toEqual({ kind: 'loading' });
  });
  it('is empty with nothing today, or an option-less nom today', () => {
    expect(todayScreen(true, false, [nom({ createdAt: '2026-07-01T09:00:00' })], now)).toEqual({
      kind: 'empty',
    });
    expect(todayScreen(true, false, [nom({ optionPlaceIds: [] })], now)).toEqual({ kind: 'empty' });
  });
  it('is open / decided from today’s latest nom', () => {
    const open = nom({});
    expect(todayScreen(true, false, [open], now)).toEqual({ kind: 'open', nom: open });
    const decided = nom({ status: 'SELECTED', selectedPlaceId: 'a' });
    expect(todayScreen(true, false, [decided], now)).toEqual({ kind: 'decided', nom: decided });
  });
});

describe('nomDetailScreen', () => {
  it('gates, then reports a missing nom as its own state', () => {
    expect(nomDetailScreen(false, false, undefined)).toEqual({ kind: 'signed-out' });
    expect(nomDetailScreen(true, true, undefined)).toEqual({ kind: 'loading' });
    expect(nomDetailScreen(true, false, undefined)).toEqual({ kind: 'missing' });
  });
  it('derives open / decided from the nom phase', () => {
    expect(nomDetailScreen(true, false, nom({})).kind).toBe('open');
    expect(
      nomDetailScreen(true, false, nom({ status: 'SELECTED', selectedPlaceId: 'a' })).kind,
    ).toBe('decided');
    // SELECTED without a place is still open (half-written row).
    expect(nomDetailScreen(true, false, nom({ status: 'SELECTED' })).kind).toBe('open');
  });
});

describe('nomsListScreen', () => {
  it('gates, then empty vs list', () => {
    expect(nomsListScreen(false, false, [])).toEqual({ kind: 'signed-out' });
    expect(nomsListScreen(true, true, [])).toEqual({ kind: 'loading' });
    expect(nomsListScreen(true, false, [])).toEqual({ kind: 'empty' });
    const list = [nom({})];
    expect(nomsListScreen(true, false, list)).toEqual({ kind: 'list', noms: list });
  });
});
