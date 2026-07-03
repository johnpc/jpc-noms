import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import type { Nom } from './types';

const m = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock('../../lib/dataClient', () => ({ dataClient: { models: { Nom: { update: m.update } } } }));

import { useAddOption, useSelectOption } from './nomMutations';

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
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
