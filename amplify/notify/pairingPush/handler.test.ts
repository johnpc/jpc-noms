import { describe, it, expect, vi, beforeEach } from 'vitest';

const e = vi.hoisted(() => ({ tokensForOwner: vi.fn(), pushToToken: vi.fn() }));
vi.mock('../shared/devices', () => ({ tokensForOwner: e.tokensForOwner }));
vi.mock('../shared/apns', () => ({ pushToToken: e.pushToToken }));

import { handler } from './handler';

const activeInsert = {
  eventName: 'INSERT',
  dynamodb: {
    NewImage: { members: { L: [{ S: 'u1' }, { S: 'u2' }] }, status: { S: 'ACTIVE' } },
  },
};

describe('pairing-push handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    e.tokensForOwner.mockResolvedValue(['tok']);
    e.pushToToken.mockResolvedValue(undefined);
  });

  it('notifies both members when a pairing goes active', async () => {
    await handler({ Records: [activeInsert] } as never);
    expect(e.tokensForOwner).toHaveBeenCalledWith('u1');
    expect(e.tokensForOwner).toHaveBeenCalledWith('u2');
    expect(e.pushToToken).toHaveBeenCalled();
  });

  it('skips a still-pending pairing', async () => {
    const pending = {
      eventName: 'INSERT',
      dynamodb: { NewImage: { members: { L: [{ S: 'u1' }] }, status: { S: 'PENDING' } } },
    };
    await handler({ Records: [pending] } as never);
    expect(e.pushToToken).not.toHaveBeenCalled();
  });
});
