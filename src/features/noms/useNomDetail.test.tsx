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
  actions: { add: vi.fn(), select: vi.fn(), busy: false } as Record<string, unknown>,
  useNomActions: vi.fn(),
  realtime: vi.fn(),
}));
vi.mock('../auth/useAuth', () => ({ useAuth: () => h.auth }));
vi.mock('./nomsApi', () => ({ useNoms: () => h.noms }));
vi.mock('./useNomActions', () => ({ useNomActions: h.useNomActions }));
vi.mock('./useNomsRealtime', () => ({ useNomsRealtime: h.realtime }));
vi.mock('../rotation/rotationApi', () => ({ useRotation: () => h.rotation }));

import { useNomDetail } from './useNomDetail';

const nom: Nom = {
  id: 'n1',
  pairingId: 'p1',
  members: ['u1', 'u2'],
  optionPlaceIds: ['a'],
  status: 'OPEN',
};

describe('useNomDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.noms = { data: [nom], isLoading: false };
    h.rotation = { data: [{ googlePlaceId: 'a' }, { googlePlaceId: 'b' }] };
    h.useNomActions.mockReturnValue(h.actions);
  });

  it('offers only rotation places not already an option', () => {
    const { result } = renderHook(() => useNomDetail('n1'));
    expect(result.current.addable).toEqual(['b']);
  });

  it('passes the found nom + actor to useNomActions and spreads its actions', () => {
    const { result } = renderHook(() => useNomDetail('n1'));
    expect(h.useNomActions).toHaveBeenCalledWith(nom, { sub: 'u1', label: 'me@x.com' });
    expect(result.current.add).toBe(h.actions.add);
    expect(result.current.busy).toBe(false);
  });

  it('reports an unknown id as the missing screen', () => {
    const { result } = renderHook(() => useNomDetail('missing'));
    expect(result.current.screen).toEqual({ kind: 'missing' });
    expect(h.useNomActions).toHaveBeenCalledWith(undefined, expect.anything());
  });
});

describe('useNomDetail screen', () => {
  it('derives open / decided from the found nom', () => {
    h.useNomActions.mockReturnValue(h.actions);
    h.noms = { data: [nom], isLoading: false };
    expect(renderHook(() => useNomDetail('n1')).result.current.screen).toEqual({
      kind: 'open',
      nom,
    });
    const decided = { ...nom, status: 'SELECTED' as const, selectedPlaceId: 'a' };
    h.noms = { data: [decided], isLoading: false };
    expect(renderHook(() => useNomDetail('n1')).result.current.screen).toEqual({
      kind: 'decided',
      nom: decided,
    });
  });
});
