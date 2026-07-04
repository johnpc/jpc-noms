import { describe, it, expect } from 'vitest';
import { computeNomStats } from './nomStats';
import type { Nom } from '../noms/types';

const nom = (over: Partial<Nom>): Nom => ({
  id: Math.random().toString(36).slice(2),
  pairingId: 'p1',
  members: ['u1', 'u2'],
  optionPlaceIds: [],
  status: 'OPEN',
  ...over,
});

describe('computeNomStats', () => {
  it('counts decided vs open and totals', () => {
    const stats = computeNomStats([
      nom({ status: 'SELECTED', selectedPlaceId: 'a' }),
      nom({ status: 'OPEN' }),
      nom({ status: 'SELECTED', selectedPlaceId: 'b' }),
    ]);
    expect(stats).toMatchObject({ totalNoms: 3, decidedCount: 2, openCount: 1 });
    expect(stats.history).toHaveLength(2);
  });

  it('ignores SELECTED status without a selectedPlaceId', () => {
    const stats = computeNomStats([nom({ status: 'SELECTED' })]);
    expect(stats.decidedCount).toBe(0);
    expect(stats.openCount).toBe(1);
  });

  it('history is reverse-chronological by createdAt (newest first), regardless of input order', () => {
    const older = nom({
      id: 'older',
      status: 'SELECTED',
      selectedPlaceId: 'a',
      createdAt: '2026-01-01T00:00:00Z',
    });
    const newer = nom({
      id: 'newer',
      status: 'SELECTED',
      selectedPlaceId: 'b',
      createdAt: '2026-06-01T00:00:00Z',
    });
    expect(computeNomStats([older, newer]).history.map((n) => n.id)).toEqual(['newer', 'older']);
    // shuffled input still sorts correctly
    expect(computeNomStats([newer, older]).history.map((n) => n.id)).toEqual(['newer', 'older']);
  });

  it('handles an empty list', () => {
    expect(computeNomStats([])).toEqual({
      totalNoms: 0,
      decidedCount: 0,
      openCount: 0,
      history: [],
    });
  });
});
