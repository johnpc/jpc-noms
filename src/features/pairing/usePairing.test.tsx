import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  auth: { status: 'authenticated' as string, email: 'a@x.com' as string | null },
  query: { data: null as unknown, isLoading: false },
  create: vi.fn(),
  accept: vi.fn(),
}));
vi.mock('../auth/useAuth', () => ({ useAuth: () => h.auth }));
vi.mock('./pairingApi', () => ({
  usePairing: () => h.query,
  useCreatePairing: () => ({ mutate: h.create, isPending: false }),
  useAcceptPairing: () => ({ mutate: h.accept, isPending: false }),
}));

import { usePairingFlow } from './usePairing';

describe('usePairingFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.auth = { status: 'authenticated', email: 'a@x.com' };
    h.query = { data: null, isLoading: false };
  });

  it('classifies the pairing into a view from the caller perspective', () => {
    h.query = {
      data: {
        id: 'p1',
        members: ['u1'],
        inviterEmail: 'a@x.com',
        inviteeEmail: 'b@x.com',
        status: 'PENDING',
      },
      isLoading: false,
    };
    const { result } = renderHook(() => usePairingFlow());
    expect(result.current.view).toEqual({ kind: 'pending-sent', partnerEmail: 'b@x.com' });
  });

  it('does not invite with an empty email', () => {
    const { result } = renderHook(() => usePairingFlow());
    act(() => result.current.invite());
    expect(h.create).not.toHaveBeenCalled();
  });

  it('reports signed-out state', () => {
    h.auth = { status: 'unauthenticated', email: null };
    const { result } = renderHook(() => usePairingFlow());
    expect(result.current.signedIn).toBe(false);
  });
});
