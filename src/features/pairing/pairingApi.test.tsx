import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';

const m = vi.hoisted(() => ({ list: vi.fn(), create: vi.fn(), accept: vi.fn() }));
vi.mock('../../lib/dataClient', () => ({
  dataClient: {
    models: { Pairing: { list: m.list } },
    mutations: { invitePartner: m.create, acceptInvite: m.accept },
  },
}));

import { usePairing, useCreatePairing, useAcceptPairing } from './pairingApi';

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('pairingApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.create.mockResolvedValue({ data: { id: 'p1' } });
    m.accept.mockResolvedValue({ data: { id: 'p1', status: 'ACTIVE' } });
  });

  it('usePairing returns the first pairing via userPool, disabled when gated off', async () => {
    const off = renderHook(() => usePairing(false), { wrapper });
    expect(off.result.current.fetchStatus).toBe('idle');

    m.list.mockResolvedValue({ data: [{ id: 'p1' }] });
    const on = renderHook(() => usePairing(true), { wrapper });
    await waitFor(() => expect(on.result.current.isSuccess).toBe(true));
    expect(on.result.current.data).toEqual({ id: 'p1' });
    expect(m.list).toHaveBeenCalledWith({ authMode: 'userPool' });
  });

  it('useCreatePairing invites by email', async () => {
    const { result } = renderHook(() => useCreatePairing(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync('b@x.com');
    });
    expect(m.create).toHaveBeenCalledWith({ inviteeEmail: 'b@x.com' }, { authMode: 'userPool' });
  });

  it('useAcceptPairing accepts by id', async () => {
    const { result } = renderHook(() => useAcceptPairing(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync('p1');
    });
    expect(m.accept).toHaveBeenCalledWith({ pairingId: 'p1' }, { authMode: 'userPool' });
  });
});
