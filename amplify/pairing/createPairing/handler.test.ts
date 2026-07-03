import { describe, it, expect, vi, beforeEach } from 'vitest';

const e = vi.hoisted(() => ({ putPending: vi.fn() }));
vi.mock('../shared/pairingTable', () => ({ putPending: e.putPending }));

import { handler } from './handler';

type Ev = { arguments: { inviteeEmail: string; callerEmail: string }; identity: unknown };
const call = handler as unknown as (ev: Ev) => Promise<unknown>;
const identity = { sub: 'u1', claims: { sub: 'u1' } };

describe('createPairing handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    e.putPending.mockResolvedValue({ id: 'p1' });
  });

  it('creates a PENDING pairing from the caller-supplied emails', async () => {
    const out = await call({
      arguments: { inviteeEmail: 'B@X.com', callerEmail: 'A@X.com' },
      identity,
    });
    expect(out).toEqual({ id: 'p1' });
    expect(e.putPending).toHaveBeenCalledWith({
      inviterSub: 'u1',
      inviterEmail: 'a@x.com',
      inviteeEmail: 'b@x.com',
    });
  });

  it('rejects pairing with yourself', async () => {
    await expect(
      call({ arguments: { inviteeEmail: 'A@X.com', callerEmail: 'a@x.com' }, identity }),
    ).rejects.toThrow('cannot pair with yourself');
    expect(e.putPending).not.toHaveBeenCalled();
  });
});
