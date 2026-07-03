import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  auth: { status: 'authenticated' as string, sub: 'me' as string | null },
  pairing: { data: null as unknown },
  noms: { data: [] as unknown[], isLoading: false },
  create: vi.fn(),
  realtime: vi.fn(),
}));
vi.mock('../auth/useAuth', () => ({ useAuth: () => h.auth }));
vi.mock('../pairing/pairingApi', () => ({ usePairing: () => h.pairing }));
vi.mock('./nomsApi', () => ({
  useNoms: () => h.noms,
  useCreateNom: () => ({ mutate: h.create, isPending: false }),
}));
vi.mock('./useNomsRealtime', () => ({ useNomsRealtime: h.realtime }));

import { useNomsList } from './useNoms';

describe('useNomsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.auth = { status: 'authenticated', sub: 'me' };
    h.pairing = { data: null };
  });

  it('is not paired without an ACTIVE pairing', () => {
    h.pairing = { data: { id: 'p1', status: 'PENDING', members: ['u1'] } };
    const { result } = renderHook(() => useNomsList());
    expect(result.current.paired).toBe(false);
  });

  it('creates a nom stamped with the active pairing members (no title — noms are dated)', () => {
    h.pairing = { data: { id: 'p1', status: 'ACTIVE', members: ['u1', 'u2'] } };
    const { result } = renderHook(() => useNomsList());
    expect(result.current.paired).toBe(true);
    result.current.createNom();
    expect(h.create).toHaveBeenCalledWith({ pairingId: 'p1', members: ['u1', 'u2'] });
  });

  it('creates a SOLO nom when unpaired (members: [self], pairingId solo)', () => {
    const { result } = renderHook(() => useNomsList());
    result.current.createNom();
    expect(h.create).toHaveBeenCalledWith({ pairingId: 'solo', members: ['me'] });
  });

  it('does not create when signed out', () => {
    h.auth = { status: 'unauthenticated', sub: null };
    const { result } = renderHook(() => useNomsList());
    result.current.createNom();
    expect(h.create).not.toHaveBeenCalled();
  });
});
