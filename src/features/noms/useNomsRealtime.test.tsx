import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import type { Nom } from './types';

const subs = vi.hoisted(() => ({
  onCreate: vi.fn(),
  onUpdate: vi.fn(),
  onDelete: vi.fn(),
  unsub: vi.fn(),
}));
vi.mock('../../lib/dataClient', () => ({
  dataClient: {
    models: {
      Nom: {
        onCreate: () => ({ subscribe: subs.onCreate }),
        onUpdate: () => ({ subscribe: subs.onUpdate }),
        onDelete: () => ({ subscribe: subs.onDelete }),
      },
    },
  },
}));

import { useNomsRealtime } from './useNomsRealtime';

let qc: QueryClient;
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('useNomsRealtime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    qc = new QueryClient();
    subs.onCreate.mockReturnValue({ unsubscribe: subs.unsub });
    subs.onUpdate.mockReturnValue({ unsubscribe: subs.unsub });
    subs.onDelete.mockReturnValue({ unsubscribe: subs.unsub });
  });

  it('does not subscribe when disabled', () => {
    renderHook(() => useNomsRealtime(false), { wrapper });
    expect(subs.onCreate).not.toHaveBeenCalled();
  });

  it('subscribes to create + update + delete when enabled, and cleans up', () => {
    const { unmount } = renderHook(() => useNomsRealtime(true), { wrapper });
    expect(subs.onCreate).toHaveBeenCalled();
    expect(subs.onUpdate).toHaveBeenCalled();
    expect(subs.onDelete).toHaveBeenCalled();
    unmount();
    expect(subs.unsub).toHaveBeenCalledTimes(3);
  });

  it('applies an update payload straight into the cache (no refetch)', () => {
    const invalidate = vi.spyOn(qc, 'invalidateQueries');
    renderHook(() => useNomsRealtime(true), { wrapper });
    const onNext = subs.onUpdate.mock.calls[0][0].next as (r: Record<string, unknown>) => void;
    onNext({ id: 'n1', pairingId: 'p1', members: ['u1'], optionPlaceIds: ['a'], status: 'OPEN' });
    const cached = qc.getQueryData<Nom[]>(['noms']);
    expect(cached?.[0]).toMatchObject({ id: 'n1', optionPlaceIds: ['a'] });
    expect(invalidate).not.toHaveBeenCalled();
  });

  it('removes a nom from the cache on delete', () => {
    qc.setQueryData<Nom[]>(
      ['noms'],
      [{ id: 'n1', pairingId: 'p', members: [], optionPlaceIds: [], status: 'OPEN' }],
    );
    renderHook(() => useNomsRealtime(true), { wrapper });
    const onNext = subs.onDelete.mock.calls[0][0].next as (r: Record<string, unknown>) => void;
    onNext({ id: 'n1' });
    expect(qc.getQueryData<Nom[]>(['noms'])).toEqual([]);
  });
});
