import { describe, it, expect, vi, beforeEach } from 'vitest';

const e = vi.hoisted(() => ({ tokensForOwner: vi.fn(), pushToToken: vi.fn() }));
vi.mock('../shared/devices', () => ({ tokensForOwner: e.tokensForOwner }));
vi.mock('../shared/apns', () => ({ pushToToken: e.pushToToken }));

import { handler } from './handler';

// Minimal DynamoDB stream record for a nom that just gained an option.
const record = (over: Record<string, unknown> = {}) => ({
  eventName: 'MODIFY',
  dynamodb: {
    NewImage: {
      members: { L: [{ S: 'u1' }, { S: 'u2' }] },
      optionPlaceIds: { L: [{ S: 'a' }] },
      lastActorSub: { S: 'u1' },
      lastActionText: { S: 'John' },
      title: { S: 'Fri' },
      ...(over.NewImage as object),
    },
    OldImage: { members: { L: [{ S: 'u1' }, { S: 'u2' }] }, optionPlaceIds: { L: [] } },
  },
});

describe('nom-push handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    e.tokensForOwner.mockResolvedValue(['tok-1']);
    e.pushToToken.mockResolvedValue(undefined);
  });

  it('pushes to the other member’s device tokens', async () => {
    await handler({ Records: [record()] } as never);
    expect(e.tokensForOwner).toHaveBeenCalledWith('u2');
    expect(e.tokensForOwner).not.toHaveBeenCalledWith('u1');
    expect(e.pushToToken).toHaveBeenCalledWith('tok-1', 'Noms', 'John added a spot to Fri');
  });

  it('skips records that do not warrant a notification', async () => {
    const noop = {
      eventName: 'MODIFY',
      dynamodb: {
        NewImage: { members: { L: [{ S: 'u1' }] }, optionPlaceIds: { L: [{ S: 'a' }] } },
        OldImage: { members: { L: [{ S: 'u1' }] }, optionPlaceIds: { L: [{ S: 'a' }] } },
      },
    };
    await handler({ Records: [noop] } as never);
    expect(e.pushToToken).not.toHaveBeenCalled();
  });

  it('dedupes tokens across recipients', async () => {
    e.tokensForOwner.mockResolvedValue(['dup', 'dup']);
    await handler({ Records: [record()] } as never);
    expect(e.pushToToken).toHaveBeenCalledTimes(1);
  });
});
