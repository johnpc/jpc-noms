import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Nom } from './types';

const h = vi.hoisted(() => ({
  auth: {
    status: 'authenticated' as string,
    email: 'me@x.com' as string | null,
    sub: 'u1' as string | null,
  },
  noms: { data: [] as Nom[], isLoading: false },
  rotation: { data: [] as { googlePlaceId: string }[] },
  actions: { add: vi.fn(), busy: false } as Record<string, unknown>,
  useNomActions: vi.fn(),
  realtime: vi.fn(),
}));
vi.mock('../auth/useAuth', () => ({ useAuth: () => h.auth }));
vi.mock('./nomsApi', () => ({ useNoms: () => h.noms }));
vi.mock('./useNomActions', () => ({ useNomActions: h.useNomActions }));
vi.mock('./useNomsRealtime', () => ({ useNomsRealtime: h.realtime }));
vi.mock('../rotation/rotationApi', () => ({ useRotation: () => h.rotation }));

import { useToday } from './useToday';

// Build noms relative to the machine's "today" so the calendar-day filter holds
// regardless of when the test runs.
const iso = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};
const nom = (over: Partial<Nom>): Nom => ({
  id: 'n',
  pairingId: 'p1',
  members: ['u1', 'u2'],
  optionPlaceIds: [],
  status: 'OPEN',
  ...over,
});

describe('useToday', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.auth = { status: 'authenticated', email: 'me@x.com', sub: 'u1' };
    h.rotation = { data: [{ googlePlaceId: 'a' }, { googlePlaceId: 'b' }] };
    h.useNomActions.mockReturnValue(h.actions);
  });

  it('exposes today’s nom + the previous decided nom, and passes /today redirect', () => {
    const today = nom({ id: 'today', createdAt: iso(0), optionPlaceIds: ['a'] });
    const prev = nom({ id: 'prev', createdAt: iso(3), status: 'SELECTED', selectedPlaceId: 'x' });
    h.noms = { data: [prev, today], isLoading: false };
    const { result } = renderHook(() => useToday());
    expect(result.current.nom?.id).toBe('today');
    expect(result.current.previous?.id).toBe('prev');
    // rotation place 'a' is already an option → only 'b' is addable
    expect(result.current.addable).toEqual(['b']);
    expect(h.useNomActions).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'today' }),
      { sub: 'u1', label: 'me@x.com' },
      '/today',
    );
  });

  it('has no nom today when nothing was created today', () => {
    h.noms = { data: [nom({ id: 'old', createdAt: iso(2) })], isLoading: false };
    const { result } = renderHook(() => useToday());
    expect(result.current.nom).toBeUndefined();
  });

  it('reports signed-out state', () => {
    h.auth = { status: 'unauthenticated', email: null, sub: null };
    const { result } = renderHook(() => useToday());
    expect(result.current.signedIn).toBe(false);
  });
});
