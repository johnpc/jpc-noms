import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  auth: {
    status: 'authenticated' as string,
    email: 'me@x.com' as string | null,
    sub: 'me' as string | null,
  },
  pairing: { data: null as unknown },
}));
vi.mock('../auth/useAuth', () => ({ useAuth: () => h.auth }));
vi.mock('../pairing/pairingApi', () => ({ usePairing: () => h.pairing }));

import { useNomMembership } from './useNomMembership';

describe('useNomMembership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.auth = { status: 'authenticated', email: 'me@x.com', sub: 'me' };
    h.pairing = { data: null };
  });

  it('is solo (members: [self], pairingId solo) when unpaired', () => {
    const { result } = renderHook(() => useNomMembership());
    expect(result.current.paired).toBe(false);
    expect(result.current.pairingId).toBe('solo');
    expect(result.current.members).toEqual(['me']);
    expect(result.current.actor).toEqual({ sub: 'me', label: 'me@x.com' });
  });

  it('uses the ACTIVE pairing members + id when paired', () => {
    h.pairing = { data: { id: 'p1', status: 'ACTIVE', members: ['me', 'you'] } };
    const { result } = renderHook(() => useNomMembership());
    expect(result.current.paired).toBe(true);
    expect(result.current.pairingId).toBe('p1');
    expect(result.current.members).toEqual(['me', 'you']);
  });

  it('a PENDING pairing is not active — stays solo', () => {
    h.pairing = { data: { id: 'p1', status: 'PENDING', members: ['me'] } };
    const { result } = renderHook(() => useNomMembership());
    expect(result.current.paired).toBe(false);
    expect(result.current.pairingId).toBe('solo');
  });

  it('has empty members when signed out', () => {
    h.auth = { status: 'unauthenticated', email: null, sub: null };
    const { result } = renderHook(() => useNomMembership());
    expect(result.current.signedIn).toBe(false);
    expect(result.current.members).toEqual([]);
  });
});
