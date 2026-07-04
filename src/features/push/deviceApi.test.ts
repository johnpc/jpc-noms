import { describe, it, expect, vi, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({ list: vi.fn(), create: vi.fn(), del: vi.fn() }));
vi.mock('../../lib/dataClient', () => ({
  dataClient: { models: { Device: { list: m.list, create: m.create, delete: m.del } } },
}));

import { registerDevice, unregisterDevice } from './deviceApi';

describe('registerDevice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    m.create.mockResolvedValue({});
  });

  it('creates a Device row for a new token via userPool + caches the token', async () => {
    m.list.mockResolvedValue({ data: [] });
    await registerDevice('tok-new', 'u1');
    expect(m.create).toHaveBeenCalledWith(
      { token: 'tok-new', platform: 'ios', ownerSub: 'u1' },
      { authMode: 'userPool' },
    );
    expect(localStorage.getItem('noms.pushToken')).toBe('tok-new');
  });

  it('does not duplicate an already-registered token', async () => {
    m.list.mockResolvedValue({ data: [{ token: 'tok-1' }] });
    await registerDevice('tok-1', 'u1');
    expect(m.create).not.toHaveBeenCalled();
  });
});

describe('unregisterDevice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('deletes the row matching this device’s cached token', async () => {
    localStorage.setItem('noms.pushToken', 'tok-1');
    m.list.mockResolvedValue({
      data: [
        { id: 'd1', token: 'tok-1' },
        { id: 'd2', token: 'other' },
      ],
    });
    m.del.mockResolvedValue({});
    await unregisterDevice();
    expect(m.del).toHaveBeenCalledWith({ id: 'd1' }, { authMode: 'userPool' });
    expect(m.del).toHaveBeenCalledTimes(1);
  });

  it('no-ops when no token is cached', async () => {
    await unregisterDevice();
    expect(m.list).not.toHaveBeenCalled();
  });
});
