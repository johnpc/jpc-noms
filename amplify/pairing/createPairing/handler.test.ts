import { describe, it, expect, vi, beforeEach } from 'vitest';

const e = vi.hoisted(() => ({ putPending: vi.fn() }));
vi.mock('../shared/pairingTable', () => ({ putPending: e.putPending }));

import { handler } from './handler';

type Ev = { arguments: { inviteeEmail: string }; identity: unknown };
const call = handler as unknown as (ev: Ev) => Promise<unknown>;
const identity = { sub: 'u1', claims: { sub: 'u1', email: 'a@x.com' } };

describe('createPairing handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    e.putPending.mockResolvedValue({ id: 'p1' });
  });

  it('creates a PENDING pairing for the invitee email', async () => {
    const out = await call({ arguments: { inviteeEmail: 'B@X.com' }, identity });
    expect(out).toEqual({ id: 'p1' });
    expect(e.putPending).toHaveBeenCalledWith({
      inviterSub: 'u1',
      inviterEmail: 'a@x.com',
      inviteeEmail: 'b@x.com',
    });
  });

  it('rejects pairing with yourself', async () => {
    await expect(call({ arguments: { inviteeEmail: 'A@X.com' }, identity })).rejects.toThrow(
      'cannot pair with yourself',
    );
    expect(e.putPending).not.toHaveBeenCalled();
  });
});
