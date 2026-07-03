import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import type { Nom } from './types';

const m = vi.hoisted(() => ({ update: vi.fn(), del: vi.fn() }));
vi.mock('../../lib/dataClient', () => ({
  dataClient: { models: { Nom: { update: m.update, delete: m.del } } },
}));

import { useRemoveOption, useReopenNom, useDeleteNom } from './nomLifecycle';

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

const nom: Nom = {
  id: 'n1',
  pairingId: 'p1',
  members: ['u1', 'u2'],
  optionPlaceIds: ['a', 'b'],
  selectedPlaceId: 'a',
  status: 'SELECTED',
};
const actor = { sub: 'u1', label: 'me@x.com' };

describe('nomLifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.update.mockResolvedValue({});
    m.del.mockResolvedValue({});
  });

  it('useRemoveOption drops the option + stamps the actor', async () => {
    const { result } = renderHook(() => useRemoveOption(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ nom, placeId: 'a', actor });
    });
    expect(m.update).toHaveBeenCalledWith(
      { id: 'n1', optionPlaceIds: ['b'], lastActorSub: 'u1', lastActionText: 'me@x.com' },
      { authMode: 'userPool' },
    );
  });

  it('useReopenNom clears selection + sets OPEN', async () => {
    const { result } = renderHook(() => useReopenNom(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ nom, actor });
    });
    expect(m.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'n1',
        selectedPlaceId: null,
        selectedBy: null,
        status: 'OPEN',
      }),
      { authMode: 'userPool' },
    );
  });

  it('useDeleteNom deletes by id', async () => {
    const { result } = renderHook(() => useDeleteNom(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync('n1');
    });
    expect(m.del).toHaveBeenCalledWith({ id: 'n1' }, { authMode: 'userPool' });
  });
});
