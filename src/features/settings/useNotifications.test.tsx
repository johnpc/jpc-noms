import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  auth: { sub: 'u1' as string | null },
  pushStatus: vi.fn(),
  enablePush: vi.fn(),
  disablePush: vi.fn(),
  isOptedOut: vi.fn(),
}));
vi.mock('../auth/useAuth', () => ({ useAuth: () => h.auth }));
vi.mock('../push/registerPush', () => ({
  pushStatus: h.pushStatus,
  enablePush: h.enablePush,
  disablePush: h.disablePush,
  isOptedOut: h.isOptedOut,
}));

import { useNotifications } from './useNotifications';

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.auth = { sub: 'u1' };
    h.pushStatus.mockResolvedValue('granted');
    h.isOptedOut.mockReturnValue(false);
    h.enablePush.mockResolvedValue('granted');
    h.disablePush.mockResolvedValue(undefined);
  });

  it('is "on" when iOS-granted and not opted out', async () => {
    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.state).toBe('on'));
  });

  it('is "off" when iOS-granted but opted out in-app', async () => {
    h.isOptedOut.mockReturnValue(true);
    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.state).toBe('off'));
  });

  it('passes through prompt / denied / web permission states', async () => {
    h.pushStatus.mockResolvedValue('denied');
    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.state).toBe('denied'));
  });

  it('disable() removes the token and flips to off', async () => {
    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.state).toBe('on'));
    h.isOptedOut.mockReturnValue(true); // disablePush sets the flag
    await act(async () => {
      await result.current.disable();
    });
    expect(h.disablePush).toHaveBeenCalled();
    expect(result.current.state).toBe('off');
  });

  it('enable() registers and flips back to on', async () => {
    h.isOptedOut.mockReturnValue(true);
    h.pushStatus.mockResolvedValue('granted');
    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.state).toBe('off'));
    h.isOptedOut.mockReturnValue(false); // enablePush clears the flag
    await act(async () => {
      await result.current.enable();
    });
    expect(h.enablePush).toHaveBeenCalledWith('u1');
    expect(result.current.state).toBe('on');
  });
});
