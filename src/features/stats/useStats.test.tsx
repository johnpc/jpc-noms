import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Nom } from '../noms/types';

const h = vi.hoisted(() => ({
  auth: { status: 'authenticated' as string },
  noms: { data: [] as Nom[], isLoading: false },
  realtime: vi.fn(),
}));
vi.mock('../auth/useAuth', () => ({ useAuth: () => h.auth }));
vi.mock('../noms/nomsApi', () => ({ useNoms: () => h.noms }));
vi.mock('../noms/useNomsRealtime', () => ({ useNomsRealtime: h.realtime }));

import { useStats } from './useStats';

describe('useStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.auth = { status: 'authenticated' };
  });

  it('derives stats from the live noms', () => {
    h.noms = {
      data: [
        {
          id: 'a',
          pairingId: 'p',
          members: [],
          optionPlaceIds: [],
          status: 'SELECTED',
          selectedPlaceId: 'x',
        },
        { id: 'b', pairingId: 'p', members: [], optionPlaceIds: [], status: 'OPEN' },
      ],
      isLoading: false,
    };
    const { result } = renderHook(() => useStats());
    expect(result.current.stats).toMatchObject({ decidedCount: 1, openCount: 1, totalNoms: 2 });
    expect(h.realtime).toHaveBeenCalledWith(true);
  });

  it('reports signed-out state', () => {
    h.auth = { status: 'unauthenticated' };
    const { result } = renderHook(() => useStats());
    expect(result.current.signedIn).toBe(false);
  });
});
