import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import type { Nom } from './types';

const m = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock('../../lib/dataClient', () => ({ dataClient: { models: { Nom: { update: m.update } } } }));

import { useAddOption, useSelectOption } from './nomMutations';

let qc: QueryClient;
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

const nom: Nom = {
  id: 'n1',
  pairingId: 'p1',
  members: ['u1', 'u2'],
  optionPlaceIds: ['a'],
  status: 'OPEN',
};

describe('nomMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.update.mockResolvedValue({});
    qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  const actor = { sub: 'u1', label: 'me@x.com' };

  it('useAddOption appends the place id (no dup) + stamps the actor, via userPool', async () => {
    const { result } = renderHook(() => useAddOption(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ nom, placeId: 'b', actor });
    });
    expect(m.update).toHaveBeenCalledWith(
      { id: 'n1', optionPlaceIds: ['a', 'b'], lastActorSub: 'u1', lastActionText: 'me@x.com' },
      { authMode: 'userPool' },
    );
  });

  it('useAddOption updates the [noms] cache optimistically (before the network resolves)', async () => {
    qc.setQueryData(['noms'], [nom]);
    let release!: () => void;
    m.update.mockReturnValue(new Promise<void>((res) => (release = () => res())));
    const { result } = renderHook(() => useAddOption(), { wrapper });
    act(() => {
      result.current.mutate({ nom, placeId: 'b', actor });
    });
    // Cache reflects the add while the write is still in flight.
    await act(async () => {
      await Promise.resolve();
    });
    const cached = qc.getQueryData<Nom[]>(['noms']);
    expect(cached?.[0].optionPlaceIds).toEqual(['a', 'b']);
    await act(async () => release());
  });

  it('useAddOption rolls the cache back when the write fails', async () => {
    qc.setQueryData(['noms'], [nom]);
    m.update.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useAddOption(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ nom, placeId: 'b', actor }).catch(() => undefined);
    });
    const cached = qc.getQueryData<Nom[]>(['noms']);
    expect(cached?.[0].optionPlaceIds).toEqual(['a']);
  });

  it('useSelectOption sets selectedPlaceId + SELECTED + the actor', async () => {
    const { result } = renderHook(() => useSelectOption(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ nom, placeId: 'a', actor });
    });
    expect(m.update).toHaveBeenCalledWith(
      {
        id: 'n1',
        selectedPlaceId: 'a',
        selectedBy: 'me@x.com',
        status: 'SELECTED',
        lastActorSub: 'u1',
        lastActionText: 'me@x.com',
      },
      { authMode: 'userPool' },
    );
  });
});
