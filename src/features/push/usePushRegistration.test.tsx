import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  auth: { status: 'unauthenticated' as string, sub: null as string | null },
  enablePush: vi.fn(),
}));
vi.mock('../auth/useAuth', () => ({ useAuth: () => h.auth }));
vi.mock('./registerPush', () => ({ enablePush: h.enablePush }));

import { usePushRegistration } from './usePushRegistration';

describe('usePushRegistration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.auth = { status: 'unauthenticated', sub: null };
  });

  it('does not register when signed out', () => {
    renderHook(() => usePushRegistration());
    expect(h.enablePush).not.toHaveBeenCalled();
  });

  it('registers once when signed in, not again on rerender', () => {
    h.auth = { status: 'authenticated', sub: 'u1' };
    const { rerender } = renderHook(() => usePushRegistration());
    expect(h.enablePush).toHaveBeenCalledWith('u1');
    rerender();
    expect(h.enablePush).toHaveBeenCalledTimes(1);
  });
});
