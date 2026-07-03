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
  nomList: vi.fn(),
  nomUpdate: vi.fn(),
  byInvitee: vi.fn(),
}));
vi.mock('../../lib/dataClient', () => ({
  dataClient: {
    models: {
      Pairing: {
        list: m.list,
        create: m.pairingCreate,
        delete: m.pairingDelete,
        listPairingByInviteeEmail: m.byInvitee,
      },
      Nom: { list: m.nomList, update: m.nomUpdate },
    },
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
    m.accept.mockResolvedValue({ data: { id: 'p1', status: 'ACTIVE', members: ['u1', 'u2'] } });
    // adoptSoloNoms lists the caller's noms then updates the solo ones.
    m.nomList.mockResolvedValue({ data: [] });
    m.nomUpdate.mockResolvedValue({ data: {} });
    m.byInvitee.mockResolvedValue({ data: [] });
  });

  it('usePairing merges own + invitee-addressed rows, disabled when gated off', async () => {
    const off = renderHook(() => usePairing(false), { wrapper });
    expect(off.result.current.fetchStatus).toBe('idle');

    // Owned rows (member) via list(); invite addressed to me via the GSI.
    m.list.mockResolvedValue({ data: [{ id: 'p1', status: 'PENDING' }] });
    m.byInvitee.mockResolvedValue({ data: [] });
    const on = renderHook(() => usePairing(true, 'me@x.com'), { wrapper });
    await waitFor(() => expect(on.result.current.isSuccess).toBe(true));
    expect(on.result.current.data).toEqual({ id: 'p1', status: 'PENDING' });
    expect(m.list).toHaveBeenCalledWith({ authMode: 'userPool' });
    expect(m.byInvitee).toHaveBeenCalledWith(
      { inviteeEmail: 'me@x.com' },
      { authMode: 'userPool' },
    );
  });

  it('usePairing surfaces an invite addressed to me (invitee GSI) + prefers ACTIVE', async () => {
    m.list.mockResolvedValue({ data: [] }); // I'm not a member yet
    m.byInvitee.mockResolvedValue({
      data: [{ id: 'inv1', status: 'PENDING', inviteeEmail: 'me@x.com' }],
    });
    const { result } = renderHook(() => usePairing(true, 'me@x.com'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('inv1');
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
