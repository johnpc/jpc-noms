import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  isNative: vi.fn(),
  requestPermissions: vi.fn(),
  addListener: vi.fn(),
  register: vi.fn(),
  registerDevice: vi.fn(),
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: h.isNative } }));
vi.mock('@capacitor/push-notifications', () => ({
  PushNotifications: {
    requestPermissions: h.requestPermissions,
    addListener: h.addListener,
    register: h.register,
  },
}));
vi.mock('./deviceApi', () => ({ registerDevice: h.registerDevice }));

import { enablePush } from './registerPush';

describe('enablePush', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.addListener.mockResolvedValue(undefined);
    h.register.mockResolvedValue(undefined);
    h.registerDevice.mockResolvedValue(undefined);
  });

  it('no-ops on web', async () => {
    h.isNative.mockReturnValue(false);
    await enablePush('u1');
    expect(h.requestPermissions).not.toHaveBeenCalled();
  });

  it('no-ops without a sub', async () => {
    h.isNative.mockReturnValue(true);
    await enablePush('');
    expect(h.requestPermissions).not.toHaveBeenCalled();
  });

  it('does nothing when permission is denied', async () => {
    h.isNative.mockReturnValue(true);
    h.requestPermissions.mockResolvedValue({ receive: 'denied' });
    await enablePush('u1');
    expect(h.register).not.toHaveBeenCalled();
  });

  it('registers + persists the token on grant', async () => {
    h.isNative.mockReturnValue(true);
    h.requestPermissions.mockResolvedValue({ receive: 'granted' });
    await enablePush('u1');
    expect(h.addListener).toHaveBeenCalledWith('registration', expect.any(Function));
    expect(h.register).toHaveBeenCalled();
    // Fire the registration callback → registerDevice is called with the token.
    const cb = h.addListener.mock.calls[0][1] as (t: { value: string }) => void;
    cb({ value: 'tok-abc' });
    expect(h.registerDevice).toHaveBeenCalledWith('tok-abc', 'u1');
  });
});
