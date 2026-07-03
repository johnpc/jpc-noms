import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  auth: { sub: 'u1' as string | null },
  pushStatus: vi.fn(),
  enablePush: vi.fn(),
}));
vi.mock('../auth/useAuth', () => ({ useAuth: () => h.auth }));
vi.mock('../push/registerPush', () => ({
  pushStatus: h.pushStatus,
  enablePush: h.enablePush,
}));

import { useNotifications } from './useNotifications';

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.auth = { sub: 'u1' };
    h.pushStatus.mockResolvedValue('prompt');
    h.enablePush.mockResolvedValue('granted');
  });

  it('loads the current status on mount', async () => {
    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.status).toBe('prompt'));
  });

  it('enable() registers and reflects the new status', async () => {
    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.status).toBe('prompt'));
    await act(async () => {
      await result.current.enable();
    });
    expect(h.enablePush).toHaveBeenCalledWith('u1');
    expect(result.current.status).toBe('granted');
  });

  it('enable() is a no-op without a signed-in sub', async () => {
    h.auth = { sub: null };
    const { result } = renderHook(() => useNotifications());
    await act(async () => {
      await result.current.enable();
    });
    expect(h.enablePush).not.toHaveBeenCalled();
  });
});
