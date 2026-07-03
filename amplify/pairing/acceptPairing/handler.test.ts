import { describe, it, expect, vi, beforeEach } from 'vitest';

const e = vi.hoisted(() => ({ getPairing: vi.fn(), activate: vi.fn() }));
vi.mock('../shared/pairingTable', () => ({ getPairing: e.getPairing, activate: e.activate }));

import { handler } from './handler';

type Ev = { arguments: { pairingId: string; callerEmail: string }; identity: unknown };
const call = handler as unknown as (ev: Ev) => Promise<unknown>;
const identity = { sub: 'u2', claims: { sub: 'u2' } };
const pending = {
  id: 'p1',
  members: ['u1'],
  inviterEmail: 'a@x.com',
  inviteeEmail: 'b@x.com',
  status: 'PENDING',
};

describe('acceptPairing handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('activates a pairing addressed to the caller', async () => {
    e.getPairing.mockResolvedValue(pending);
    e.activate.mockResolvedValue({ ...pending, members: ['u1', 'u2'], status: 'ACTIVE' });
    const out = await call({ arguments: { pairingId: 'p1', callerEmail: 'b@x.com' }, identity });
    expect(e.activate).toHaveBeenCalledWith('p1', 'u2', ['u1']);
    expect((out as { status: string }).status).toBe('ACTIVE');
  });

  it('throws when the pairing does not exist', async () => {
    e.getPairing.mockResolvedValue(null);
    await expect(
      call({ arguments: { pairingId: 'x', callerEmail: 'b@x.com' }, identity }),
    ).rejects.toThrow('not found');
  });

  it('rejects when the invite is addressed to a different email', async () => {
    e.getPairing.mockResolvedValue({ ...pending, inviteeEmail: 'someone@else.com' });
    await expect(
      call({ arguments: { pairingId: 'p1', callerEmail: 'b@x.com' }, identity }),
    ).rejects.toThrow('different email');
    expect(e.activate).not.toHaveBeenCalled();
  });

  it('is idempotent when already ACTIVE', async () => {
    e.getPairing.mockResolvedValue({ ...pending, status: 'ACTIVE', members: ['u1', 'u2'] });
    const out = await call({ arguments: { pairingId: 'p1', callerEmail: 'b@x.com' }, identity });
    expect(e.activate).not.toHaveBeenCalled();
    expect((out as { status: string }).status).toBe('ACTIVE');
  });
});
