import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Nom } from './types';

const h = vi.hoisted(() => ({
  add: vi.fn(),
  select: vi.fn(),
  remove: vi.fn(),
  reopen: vi.fn(),
  del: vi.fn(),
  replace: vi.fn(),
  tap: vi.fn(),
  rand: vi.fn(),
}));
vi.mock('react-router-dom', () => ({ useHistory: () => ({ replace: h.replace }) }));
vi.mock('./nomMutations', () => ({
  useAddOption: () => ({ mutate: h.add, isPending: false }),
  useSelectOption: () => ({ mutate: h.select, isPending: false }),
}));
vi.mock('./nomLifecycle', () => ({
  useRemoveOption: () => ({ mutate: h.remove, isPending: false }),
  useReopenNom: () => ({ mutate: h.reopen, isPending: false }),
  useDeleteNom: () => ({ mutate: h.del, isPending: false }),
}));
vi.mock('../../lib/haptics', () => ({ tap: h.tap }));
vi.mock('../../lib/random', () => ({ randomFraction: h.rand }));

import { useNomActions } from './useNomActions';

const nom: Nom = {
  id: 'n1',
  pairingId: 'p1',
  members: ['u1'],
  optionPlaceIds: ['a', 'b', 'c'],
  status: 'OPEN',
};
const actor = { sub: 'u1', label: 'me@x.com' };

describe('useNomActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('add taps + mutates', () => {
    const { result } = renderHook(() => useNomActions(nom, actor));
    result.current.add('x');
    expect(h.tap).toHaveBeenCalled();
    expect(h.add).toHaveBeenCalledWith({ nom, placeId: 'x', actor });
  });

  it('decideForUs picks by injected fraction and selects it', () => {
    h.rand.mockReturnValue(0.5); // -> index 1 -> 'b'
    const { result } = renderHook(() => useNomActions(nom, actor));
    result.current.decideForUs();
    expect(h.select).toHaveBeenCalledWith({ nom, placeId: 'b', actor });
  });

  it('del deletes then routes back to the noms list', () => {
    const { result } = renderHook(() => useNomActions(nom, actor));
    result.current.del();
    expect(h.del).toHaveBeenCalledWith(
      'n1',
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it('is a no-op set when there is no nom', () => {
    const { result } = renderHook(() => useNomActions(undefined, actor));
    result.current.add('x');
    result.current.decideForUs();
    result.current.del();
    expect(h.add).not.toHaveBeenCalled();
    expect(h.select).not.toHaveBeenCalled();
    expect(h.del).not.toHaveBeenCalled();
  });
});
