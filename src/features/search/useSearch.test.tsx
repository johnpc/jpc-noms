import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  push: vi.fn(),
  mutate: vi.fn(),
  status: 'unauthenticated' as string,
  places: [] as unknown[],
  rotation: [] as { googlePlaceId: string }[],
}));

vi.mock('react-router-dom', () => ({ useHistory: () => ({ push: h.push }) }));
vi.mock('./useGeolocation', () => ({ useGeolocation: () => ({ latitude: 1, longitude: 2 }) }));
vi.mock('./searchApi', () => ({
  useSearchPlaces: () => ({ data: h.places, isFetching: false }),
}));
vi.mock('../auth/useAuth', () => ({ useAuth: () => ({ status: h.status }) }));
vi.mock('../rotation/rotationApi', () => ({
  useRotation: () => ({ data: h.rotation }),
  useAddToRotation: () => ({ mutate: h.mutate, isPending: false }),
}));

import { useSearch } from './useSearch';

describe('useSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.status = 'unauthenticated';
    h.rotation = [];
  });

  it('routes a guest to sign-in instead of saving', () => {
    const { result } = renderHook(() => useSearch());
    act(() => result.current.add('p1'));
    expect(h.push).toHaveBeenCalledWith('/signin');
    expect(h.mutate).not.toHaveBeenCalled();
  });

  it('saves to rotation when signed in', () => {
    h.status = 'authenticated';
    const { result } = renderHook(() => useSearch());
    act(() => result.current.add('p1'));
    expect(h.mutate).toHaveBeenCalledWith('p1');
    expect(h.push).not.toHaveBeenCalled();
  });

  it('exposes which places are already saved', () => {
    h.rotation = [{ googlePlaceId: 'p1' }];
    const { result } = renderHook(() => useSearch());
    expect(result.current.savedIds.has('p1')).toBe(true);
    expect(result.current.savedIds.has('p2')).toBe(false);
  });
});
