import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';

const q = vi.hoisted(() => ({ search: vi.fn(), getPlace: vi.fn(), getImage: vi.fn() }));
vi.mock('../../lib/dataClient', () => ({
  dataClient: {
    queries: {
      searchGooglePlaces: q.search,
      getGooglePlace: q.getPlace,
      getGooglePlaceImage: q.getImage,
    },
  },
  readAuthMode: () => Promise.resolve('identityPool'),
}));

import { useSearchPlaces, usePlace, usePlaceImage } from './searchApi';

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

const coords = { latitude: 1, longitude: 2 };

describe('searchApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('useSearchPlaces is disabled for an empty term', () => {
    const { result } = renderHook(() => useSearchPlaces(coords, '  '), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
    expect(q.search).not.toHaveBeenCalled();
  });

  it('useSearchPlaces returns non-null places for a term', async () => {
    q.search.mockResolvedValue({ data: [{ id: 'p1' }, null, { id: 'p2' }] });
    const { result } = renderHook(() => useSearchPlaces(coords, 'pizza'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 'p1' }, { id: 'p2' }]);
  });

  it('usePlace fetches by id when provided', async () => {
    q.getPlace.mockResolvedValue({ data: { id: 'p9' } });
    const { result } = renderHook(() => usePlace('p9'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ id: 'p9' });
    expect(q.getPlace).toHaveBeenCalledWith({ placeId: 'p9' }, { authMode: 'identityPool' });
  });

  it('usePlace is disabled without an id', () => {
    const { result } = renderHook(() => usePlace(undefined), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('usePlaceImage resolves a photo id to a uri', async () => {
    q.getImage.mockResolvedValue({ data: { photoUri: 'https://img/1' } });
    const { result } = renderHook(() => usePlaceImage('ph/1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe('https://img/1');
    expect(q.getImage).toHaveBeenCalledWith(
      { photoId: 'ph/1', widthPx: 800, heightPx: 500 },
      { authMode: 'identityPool' },
    );
  });

  it('usePlaceImage is disabled without a photo id', () => {
    const { result } = renderHook(() => usePlaceImage(undefined), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
  });
});
