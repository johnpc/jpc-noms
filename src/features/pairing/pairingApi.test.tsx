import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';

const m = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  accept: vi.fn(),
  pairingCreate: vi.fn(),
  pairingDelete: vi.fn(),
}));
vi.mock('../../lib/dataClient', () => ({
  dataClient: {
    models: { Pairing: { list: m.list, create: m.pairingCreate, delete: m.pairingDelete } },
    mutations: { invitePartner: m.create, acceptInvite: m.accept },
  },
}));

import {
  usePairing,
  useCreatePairing,
  useAcceptPairing,
  usePairByScan,
  useUnpair,
} from './pairingApi';

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

  it('useCreatePairing invites by email, forwarding the caller email', async () => {
    const { result } = renderHook(() => useCreatePairing(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ inviteeEmail: 'b@x.com', callerEmail: 'a@x.com' });
    });
    expect(m.create).toHaveBeenCalledWith(
      { inviteeEmail: 'b@x.com', callerEmail: 'a@x.com' },
      { authMode: 'userPool' },
    );
  });

  it('useAcceptPairing accepts by id, forwarding the caller email', async () => {
    const { result } = renderHook(() => useAcceptPairing(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ pairingId: 'p1', callerEmail: 'b@x.com' });
    });
    expect(m.accept).toHaveBeenCalledWith(
      { pairingId: 'p1', callerEmail: 'b@x.com' },
      { authMode: 'userPool' },
    );
  });

  it('usePairByScan creates an ACTIVE pairing with both subs', async () => {
    m.pairingCreate.mockResolvedValue({ data: { id: 'p1' } });
    const { result } = renderHook(() => usePairByScan(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({
        me: { sub: 'me', email: 'me@x.com' },
        partner: { sub: 'you', email: 'you@x.com' },
      });
    });
    expect(m.pairingCreate).toHaveBeenCalledWith(
      {
        members: ['me', 'you'],
        inviterEmail: 'me@x.com',
        inviteeEmail: 'you@x.com',
        status: 'ACTIVE',
      },
      { authMode: 'userPool' },
    );
  });

  it('usePairByScan rejects scanning your own code', async () => {
    const { result } = renderHook(() => usePairByScan(), { wrapper });
    await expect(
      result.current.mutateAsync({
        me: { sub: 'me', email: 'me@x.com' },
        partner: { sub: 'me', email: 'me@x.com' },
      }),
    ).rejects.toThrow('own code');
    expect(m.pairingCreate).not.toHaveBeenCalled();
  });

  it('useUnpair deletes the pairing by id', async () => {
    m.pairingDelete.mockResolvedValue({});
    const { result } = renderHook(() => useUnpair(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync('p1');
    });
    expect(m.pairingDelete).toHaveBeenCalledWith({ id: 'p1' }, { authMode: 'userPool' });
  });
});
