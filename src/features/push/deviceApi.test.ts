import { describe, it, expect, vi, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({ list: vi.fn(), create: vi.fn() }));
vi.mock('../../lib/dataClient', () => ({
  dataClient: { models: { Device: { list: m.list, create: m.create } } },
}));

import { registerDevice } from './deviceApi';

describe('registerDevice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.create.mockResolvedValue({});
  });

  it('creates a Device row for a new token via userPool', async () => {
    m.list.mockResolvedValue({ data: [] });
    await registerDevice('tok-new', 'u1');
    expect(m.create).toHaveBeenCalledWith(
      { token: 'tok-new', platform: 'ios', ownerSub: 'u1' },
      { authMode: 'userPool' },
    );
  });

  it('does not duplicate an already-registered token', async () => {
    m.list.mockResolvedValue({ data: [{ token: 'tok-1' }] });
    await registerDevice('tok-1', 'u1');
    expect(m.create).not.toHaveBeenCalled();
  });
});
