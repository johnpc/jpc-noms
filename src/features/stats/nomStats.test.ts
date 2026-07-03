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

  it('history is most-recent-first (input order reversed)', () => {
    const first = nom({ id: 'first', status: 'SELECTED', selectedPlaceId: 'a' });
    const second = nom({ id: 'second', status: 'SELECTED', selectedPlaceId: 'b' });
    const stats = computeNomStats([first, second]);
    expect(stats.history.map((n) => n.id)).toEqual(['second', 'first']);
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
