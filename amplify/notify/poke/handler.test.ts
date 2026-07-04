import { describe, it, expect, vi, beforeEach } from 'vitest';

const e = vi.hoisted(() => ({ tokensForOwner: vi.fn(), pushToToken: vi.fn() }));
vi.mock('../shared/devices', () => ({ tokensForOwner: e.tokensForOwner }));
vi.mock('../shared/apns', () => ({ pushToToken: e.pushToToken }));

import { handler } from './handler';

type Ev = { arguments: { partnerSub: string; fromLabel?: string }; identity: unknown };
const call = handler as unknown as (ev: Ev) => Promise<number>;
const identity = { sub: 'me', claims: { sub: 'me' } };

describe('poke handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    e.pushToToken.mockResolvedValue(undefined);
  });

  it('pushes the nudge to the partner’s device tokens + returns the count', async () => {
    e.tokensForOwner.mockResolvedValue(['tok-1', 'tok-2']);
    const n = await call({ arguments: { partnerSub: 'partner', fromLabel: 'John' }, identity });
    expect(e.tokensForOwner).toHaveBeenCalledWith('partner');
    expect(e.pushToToken).toHaveBeenCalledTimes(2);
    expect(e.pushToToken).toHaveBeenCalledWith(
      'tok-1',
      'jpc.noms',
      expect.stringContaining('John'),
    );
    expect(n).toBe(2);
  });

  it('dedupes tokens', async () => {
    e.tokensForOwner.mockResolvedValue(['dup', 'dup']);
    const n = await call({ arguments: { partnerSub: 'p' }, identity });
    expect(e.pushToToken).toHaveBeenCalledTimes(1);
    expect(n).toBe(1);
  });

  it('returns 0 without a partnerSub', async () => {
    const n = await call({ arguments: { partnerSub: '' }, identity });
    expect(e.pushToToken).not.toHaveBeenCalled();
    expect(n).toBe(0);
  });

  it('requires a signed-in caller', async () => {
    await expect(call({ arguments: { partnerSub: 'p' }, identity: undefined })).rejects.toThrow(
      'Unauthenticated',
    );
  });
});
