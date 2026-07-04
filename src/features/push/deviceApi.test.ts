import { describe, it, expect, vi, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({
  list: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  del: vi.fn(),
}));
vi.mock('../../lib/dataClient', () => ({
  dataClient: {
    models: {
      Device: { list: m.list, get: m.get, create: m.create, update: m.update, delete: m.del },
    },
  },
}));

import { registerDevice, unregisterDevice } from './deviceApi';

describe('registerDevice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    m.create.mockResolvedValue({});
    m.update.mockResolvedValue({});
  });

  it('creates a Device row (deterministic id) for a new token + caches the token', async () => {
    m.get.mockResolvedValue({ data: null }); // no existing row for this token's id
    await registerDevice('tok-new', 'u1');
    expect(m.create).toHaveBeenCalledTimes(1);
    const [fields, opts] = m.create.mock.calls[0];
    expect(fields).toMatchObject({ token: 'tok-new', platform: 'ios', ownerSub: 'u1' });
    expect(fields.id).toMatch(/^dev-/); // deterministic id derived from the token
    expect(opts).toEqual({ authMode: 'userPool' });
    expect(localStorage.getItem('noms.pushToken')).toBe('tok-new');
  });

  it('upserts (no duplicate) when the same token is already registered', async () => {
    m.get.mockResolvedValue({ data: { id: 'dev-abc', token: 'tok-1' } });
    await registerDevice('tok-1', 'u1');
    expect(m.create).not.toHaveBeenCalled();
    expect(m.update).toHaveBeenCalledTimes(1); // updates the existing row instead
  });

  it('maps the same token to the same deterministic id every time', async () => {
    m.get.mockResolvedValue({ data: null });
    await registerDevice('same-token', 'u1');
    await registerDevice('same-token', 'u1');
    const id1 = m.create.mock.calls[0][0].id;
    const id2 = m.create.mock.calls[1][0].id;
    expect(id1).toBe(id2);
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
