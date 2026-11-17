import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  auth: { status: 'authenticated' as string },
  rotation: { data: [] as { id: string; googlePlaceId: string }[], isLoading: false },
  remove: vi.fn(),
  addToNom: vi.fn(),
}));
vi.mock('../auth/useAuth', () => ({ useAuth: () => h.auth }));
vi.mock('./rotationApi', () => ({
  useRotation: () => h.rotation,
  useRemoveFromRotation: () => ({ mutate: h.remove, isPending: false }),
}));
vi.mock('../noms/useAddToNom', () => ({
  useAddToNom: () => ({ addToNom: h.addToNom, busy: false, nominatedIds: new Set(['p1']) }),
}));

import { rotationScreen, useRotationPage } from './useRotationPage';

describe('rotationScreen', () => {
  it('gates, then empty vs list', () => {
    expect(rotationScreen(false, false, [])).toEqual({ kind: 'signed-out' });
    expect(rotationScreen(true, true, [])).toEqual({ kind: 'loading' });
    expect(rotationScreen(true, false, [])).toEqual({ kind: 'empty' });
    const entries = [{ id: 'r1', googlePlaceId: 'p1' }];
    expect(rotationScreen(true, false, entries)).toEqual({ kind: 'list', entries });
  });
});

describe('useRotationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.auth = { status: 'authenticated' };
    h.rotation = { data: [{ id: 'r1', googlePlaceId: 'p1' }], isLoading: false };
  });

  it('exposes the screen and forwards remove / ➕ Nom', () => {
    const { result } = renderHook(() => useRotationPage());
    expect(result.current.screen.kind).toBe('list');
    act(() => result.current.remove('r1'));
    expect(h.remove).toHaveBeenCalledWith('r1');
    act(() => result.current.addToNom('p1'));
    expect(h.addToNom).toHaveBeenCalledWith('p1');
    expect(result.current.nominatedIds.has('p1')).toBe(true);
  });

  it('is signed-out when there is no session', () => {
    h.auth = { status: 'unauthenticated' };
    const { result } = renderHook(() => useRotationPage());
    expect(result.current.screen).toEqual({ kind: 'signed-out' });
  });
});
