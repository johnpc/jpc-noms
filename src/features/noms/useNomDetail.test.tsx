import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Nom } from './types';

const h = vi.hoisted(() => ({
  auth: { status: 'authenticated' as string, email: 'me@x.com' as string | null },
  noms: { data: [] as Nom[], isLoading: false },
  rotation: { data: [] as { googlePlaceId: string }[] },
  add: vi.fn(),
  select: vi.fn(),
  realtime: vi.fn(),
}));
vi.mock('../auth/useAuth', () => ({ useAuth: () => h.auth }));
vi.mock('./nomsApi', () => ({ useNoms: () => h.noms }));
vi.mock('./nomMutations', () => ({
  useAddOption: () => ({ mutate: h.add, isPending: false }),
  useSelectOption: () => ({ mutate: h.select, isPending: false }),
}));
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
  });

  it('offers only rotation places not already an option', () => {
    const { result } = renderHook(() => useNomDetail('n1'));
    expect(result.current.addable).toEqual(['b']);
  });

  it('adds an option to the found nom', () => {
    const { result } = renderHook(() => useNomDetail('n1'));
    result.current.add('b');
    expect(h.add).toHaveBeenCalledWith({ nom, placeId: 'b' });
  });

  it('selects with the caller email as `by`', () => {
    const { result } = renderHook(() => useNomDetail('n1'));
    result.current.select('a');
    expect(h.select).toHaveBeenCalledWith({ nom, placeId: 'a', by: 'me@x.com' });
  });

  it('exposes no nom when the id is unknown', () => {
    const { result } = renderHook(() => useNomDetail('missing'));
    expect(result.current.nom).toBeUndefined();
  });
});
