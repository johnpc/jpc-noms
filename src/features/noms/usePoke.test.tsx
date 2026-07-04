import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';

const h = vi.hoisted(() => ({ membership: {}, pokePartner: vi.fn() }));
vi.mock('./useNomMembership', () => ({ useNomMembership: () => h.membership }));
vi.mock('../../lib/dataClient', () => ({
  dataClient: { mutations: { pokePartner: h.pokePartner } },
}));
vi.mock('../../lib/toast', () => ({ showToast: vi.fn() }));
vi.mock('../../lib/haptics', () => ({ success: vi.fn() }));

import { usePoke } from './usePoke';

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('usePoke', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.pokePartner.mockResolvedValue({ data: 1 });
  });

  it('canPoke is false when unpaired', () => {
    h.membership = { paired: false, sub: 'me', members: ['me'], actor: { label: 'me@x.com' } };
    const { result } = renderHook(() => usePoke(), { wrapper });
    expect(result.current.canPoke).toBe(false);
  });

  it('pokes the OTHER member with the caller label', async () => {
    h.membership = {
      paired: true,
      sub: 'me',
      members: ['me', 'partner'],
      actor: { label: 'me@x.com' },
    };
    const { result } = renderHook(() => usePoke(), { wrapper });
    expect(result.current.canPoke).toBe(true);
    await act(async () => {
      result.current.poke();
    });
    await waitFor(() =>
      expect(h.pokePartner).toHaveBeenCalledWith(
        { partnerSub: 'partner', fromLabel: 'me@x.com' },
        { authMode: 'userPool' },
      ),
    );
  });
});
