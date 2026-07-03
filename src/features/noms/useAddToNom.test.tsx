import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Nom } from './types';

const h = vi.hoisted(() => ({
  membership: {
    signedIn: true as boolean,
    sub: 'me' as string | null,
    actor: { sub: 'me', label: 'me@x.com' },
    pairingId: 'solo',
    members: ['me'] as string[],
  },
  noms: [] as Nom[],
  createMutate: vi.fn(),
  addMutate: vi.fn(),
  toast: vi.fn(),
}));
vi.mock('./useNomMembership', () => ({ useNomMembership: () => h.membership }));
vi.mock('./nomsApi', () => ({
  useNoms: () => ({ data: h.noms }),
  useCreateNom: () => ({ mutateAsync: h.createMutate, isPending: false }),
}));
vi.mock('./nomMutations', () => ({
  useAddOption: () => ({ mutateAsync: h.addMutate, isPending: false }),
}));
vi.mock('../../lib/toast', () => ({ showToast: h.toast }));
vi.mock('../../lib/haptics', () => ({ tap: vi.fn() }));

import { useAddToNom } from './useAddToNom';

const openNom: Nom = {
  id: 'open1',
  pairingId: 'solo',
  members: ['me'],
  optionPlaceIds: [],
  status: 'OPEN',
};

describe('useAddToNom', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.membership = {
      signedIn: true,
      sub: 'me',
      actor: { sub: 'me', label: 'me@x.com' },
      pairingId: 'solo',
      members: ['me'],
    };
    h.noms = [];
    h.addMutate.mockResolvedValue(undefined);
    h.createMutate.mockResolvedValue(openNom);
  });

  it('adds to the existing open nom without creating a new one', async () => {
    h.noms = [openNom];
    const { result } = renderHook(() => useAddToNom());
    await act(async () => {
      await result.current.addToNom('place-1');
    });
    expect(h.createMutate).not.toHaveBeenCalled();
    expect(h.addMutate).toHaveBeenCalledWith({
      nom: openNom,
      placeId: 'place-1',
      actor: h.membership.actor,
    });
    expect(h.toast).toHaveBeenCalled();
  });

  it('creates today’s nom first when none is open, then adds to it', async () => {
    h.noms = []; // nothing open
    const { result } = renderHook(() => useAddToNom());
    await act(async () => {
      await result.current.addToNom('place-1');
    });
    expect(h.createMutate).toHaveBeenCalledWith({ pairingId: 'solo', members: ['me'] });
    expect(h.addMutate).toHaveBeenCalledWith({
      nom: openNom,
      placeId: 'place-1',
      actor: h.membership.actor,
    });
  });

  it('does nothing when signed out', async () => {
    h.membership = { ...h.membership, signedIn: false, sub: null };
    const { result } = renderHook(() => useAddToNom());
    await act(async () => {
      await result.current.addToNom('place-1');
    });
    expect(h.createMutate).not.toHaveBeenCalled();
    expect(h.addMutate).not.toHaveBeenCalled();
  });

  it('aborts if creating the nom fails to return a record', async () => {
    h.noms = [];
    h.createMutate.mockResolvedValue(null);
    const { result } = renderHook(() => useAddToNom());
    await act(async () => {
      await result.current.addToNom('place-1');
    });
    expect(h.addMutate).not.toHaveBeenCalled();
  });
});
