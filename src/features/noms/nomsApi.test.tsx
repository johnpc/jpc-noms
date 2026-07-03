import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';

const m = vi.hoisted(() => ({ list: vi.fn(), create: vi.fn() }));
vi.mock('../../lib/dataClient', () => ({
  dataClient: { models: { Nom: { list: m.list, create: m.create } } },
}));

import { useNoms, useCreateNom } from './nomsApi';

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('nomsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.create.mockResolvedValue({ data: { id: 'n1' } });
  });

  it('useNoms maps rows and filters null option ids, via userPool', async () => {
    m.list.mockResolvedValue({
      data: [
        { id: 'n1', pairingId: 'p1', members: ['u1'], optionPlaceIds: ['a', null], status: 'OPEN' },
      ],
    });
    const { result } = renderHook(() => useNoms(true), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].optionPlaceIds).toEqual(['a']);
    expect(m.list).toHaveBeenCalledWith({ authMode: 'userPool' });
  });

  it('useNoms is disabled when gated off', () => {
    const { result } = renderHook(() => useNoms(false), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('useCreateNom creates an OPEN nom with empty options for the pairing', async () => {
    const { result } = renderHook(() => useCreateNom(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ pairingId: 'p1', members: ['u1', 'u2'], title: 'Fri' });
    });
    expect(m.create).toHaveBeenCalledWith(
      { pairingId: 'p1', members: ['u1', 'u2'], title: 'Fri', optionPlaceIds: [], status: 'OPEN' },
      { authMode: 'userPool' },
    );
  });
});
