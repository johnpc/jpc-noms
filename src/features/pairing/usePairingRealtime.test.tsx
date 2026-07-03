import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';

const subs = vi.hoisted(() => ({ onCreate: vi.fn(), onUpdate: vi.fn(), unsub: vi.fn() }));
vi.mock('../../lib/dataClient', () => ({
  dataClient: {
    models: {
      Pairing: {
        onCreate: () => ({ subscribe: subs.onCreate }),
        onUpdate: () => ({ subscribe: subs.onUpdate }),
      },
    },
  },
}));

import { usePairingRealtime } from './usePairingRealtime';

let qc: QueryClient;
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('usePairingRealtime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    qc = new QueryClient();
    subs.onCreate.mockReturnValue({ unsubscribe: subs.unsub });
    subs.onUpdate.mockReturnValue({ unsubscribe: subs.unsub });
  });

  it('does not subscribe when disabled', () => {
    renderHook(() => usePairingRealtime(false), { wrapper });
    expect(subs.onCreate).not.toHaveBeenCalled();
  });

  it('subscribes and refreshes the pairing cache on an event', () => {
    const invalidate = vi.spyOn(qc, 'invalidateQueries');
    renderHook(() => usePairingRealtime(true), { wrapper });
    const onNext = subs.onCreate.mock.calls[0][0].next as () => void;
    onNext();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['pairing'] });
  });

  it('cleans up subscriptions on unmount', () => {
    const { unmount } = renderHook(() => usePairingRealtime(true), { wrapper });
    unmount();
    expect(subs.unsub).toHaveBeenCalledTimes(2);
  });
});
