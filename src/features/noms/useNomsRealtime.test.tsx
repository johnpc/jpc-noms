import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';

const subs = vi.hoisted(() => ({ onCreate: vi.fn(), onUpdate: vi.fn(), unsub: vi.fn() }));
vi.mock('../../lib/dataClient', () => ({
  dataClient: {
    models: {
      Nom: {
        onCreate: () => ({ subscribe: subs.onCreate }),
        onUpdate: () => ({ subscribe: subs.onUpdate }),
      },
    },
  },
}));

import { useNomsRealtime } from './useNomsRealtime';

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient();
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('useNomsRealtime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    subs.onCreate.mockReturnValue({ unsubscribe: subs.unsub });
    subs.onUpdate.mockReturnValue({ unsubscribe: subs.unsub });
  });

  it('does not subscribe when disabled', () => {
    renderHook(() => useNomsRealtime(false), { wrapper });
    expect(subs.onCreate).not.toHaveBeenCalled();
  });

  it('subscribes to create + update when enabled, and cleans up', () => {
    const { unmount } = renderHook(() => useNomsRealtime(true), { wrapper });
    expect(subs.onCreate).toHaveBeenCalled();
    expect(subs.onUpdate).toHaveBeenCalled();
    unmount();
    expect(subs.unsub).toHaveBeenCalledTimes(2);
  });
});
