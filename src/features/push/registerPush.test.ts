import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  isNative: vi.fn(),
  requestPermissions: vi.fn(),
  checkPermissions: vi.fn(),
  addListener: vi.fn(),
  removeAllListeners: vi.fn(),
  register: vi.fn(),
  registerDevice: vi.fn(),
  unregisterDevice: vi.fn(),
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: h.isNative } }));
vi.mock('@capacitor/push-notifications', () => ({
  PushNotifications: {
    requestPermissions: h.requestPermissions,
    checkPermissions: h.checkPermissions,
    addListener: h.addListener,
    removeAllListeners: h.removeAllListeners,
    register: h.register,
  },
}));
vi.mock('./deviceApi', () => ({
  registerDevice: h.registerDevice,
  unregisterDevice: h.unregisterDevice,
}));

import { enablePush, pushStatus, disablePush, isOptedOut, lastPushError } from './registerPush';
import { dispatchPush, getPushState } from './pushStore';

describe('enablePush', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dispatchPush({ type: 'reset' });
    h.addListener.mockResolvedValue(undefined);
    h.removeAllListeners.mockResolvedValue(undefined);
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
    expect(getPushState()).toMatchObject({ kind: 'failed', permission: 'denied' });
  });

  it('registers + persists the token on grant, walking the machine to registered', async () => {
    h.isNative.mockReturnValue(true);
    h.requestPermissions.mockResolvedValue({ receive: 'granted' });
    await enablePush('u1');
    expect(getPushState()).toEqual({ kind: 'awaiting-token' });
    expect(h.addListener).toHaveBeenCalledWith('registration', expect.any(Function));
    expect(h.register).toHaveBeenCalled();
    // Fire the registration callback → registerDevice is called with the token.
    const cb = h.addListener.mock.calls[0][1] as (t: { value: string }) => void;
    cb({ value: 'tok-abc' });
    expect(getPushState()).toEqual({ kind: 'saving', token: 'tok-abc' });
    expect(h.registerDevice).toHaveBeenCalledWith('tok-abc', 'u1');
    await vi.waitFor(() =>
      expect(getPushState()).toEqual({ kind: 'registered', token: 'tok-abc' }),
    );
  });

  it('a failed Device save fails the machine with the reason', async () => {
    h.isNative.mockReturnValue(true);
    h.requestPermissions.mockResolvedValue({ receive: 'granted' });
    h.registerDevice.mockRejectedValue(new Error('unauthorized'));
    await enablePush('u1');
    const cb = h.addListener.mock.calls[0][1] as (t: { value: string }) => void;
    cb({ value: 'tok-abc' });
    await vi.waitFor(() => expect(getPushState()).toMatchObject({ kind: 'failed' }));
    expect(lastPushError()).toContain('registerDevice failed');
  });

  it('a thrown SDK call fails the machine', async () => {
    h.isNative.mockReturnValue(true);
    h.requestPermissions.mockRejectedValue(new Error('no sdk'));
    await enablePush('u1');
    expect(getPushState()).toMatchObject({
      kind: 'failed',
      reason: expect.stringContaining('no sdk'),
    });
  });

  it('records an APNs registrationError so it is not swallowed', async () => {
    localStorage.clear();
    h.isNative.mockReturnValue(true);
    h.requestPermissions.mockResolvedValue({ receive: 'granted' });
    await enablePush('u1');
    // second addListener call is the error handler
    const errCb = h.addListener.mock.calls.find((c) => c[0] === 'registrationError')?.[1] as (
      e: unknown,
    ) => void;
    expect(errCb).toBeTypeOf('function');
    errCb({ error: 'no valid aps-environment' });
    expect(lastPushError()).toContain('registrationError');
    expect(getPushState()).toMatchObject({ kind: 'failed' });
  });
});

describe('pushStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is web when not native', async () => {
    h.isNative.mockReturnValue(false);
    expect(await pushStatus()).toBe('web');
  });

  it('maps the native permission state', async () => {
    h.isNative.mockReturnValue(true);
    h.checkPermissions.mockResolvedValue({ receive: 'granted' });
    expect(await pushStatus()).toBe('granted');
    h.checkPermissions.mockResolvedValue({ receive: 'denied' });
    expect(await pushStatus()).toBe('denied');
    h.checkPermissions.mockResolvedValue({ receive: 'prompt' });
    expect(await pushStatus()).toBe('prompt');
  });
});

describe('opt-out (disablePush / isOptedOut)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    h.unregisterDevice.mockResolvedValue(undefined);
  });

  it('disablePush sets the opt-out flag and removes the device token', async () => {
    expect(isOptedOut()).toBe(false);
    await disablePush();
    expect(h.unregisterDevice).toHaveBeenCalled();
    expect(isOptedOut()).toBe(true);
  });

  it('enablePush clears the opt-out flag on grant', async () => {
    await disablePush();
    expect(isOptedOut()).toBe(true);
    h.isNative.mockReturnValue(true);
    h.requestPermissions.mockResolvedValue({ receive: 'granted' });
    await enablePush('u1');
    expect(isOptedOut()).toBe(false);
  });
});
