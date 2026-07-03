import { describe, it, expect, vi, beforeEach } from 'vitest';

const e = vi.hoisted(() => ({ addressForPlace: vi.fn(), sendNavigation: vi.fn() }));
vi.mock('../shared/placeAddress', () => ({ addressForPlace: e.addressForPlace }));
vi.mock('../shared/tessie', () => ({ sendNavigation: e.sendNavigation }));

import { handler } from './handler';

const record = (over: Record<string, unknown> = {}) => ({
  eventName: 'MODIFY',
  dynamodb: {
    NewImage: {
      members: { L: [{ S: 'u1' }, { S: 'u2' }] },
      selectedPlaceId: { S: 'p1' },
      ...(over.NewImage as object),
    },
    OldImage: { selectedPlaceId: { S: 'NONE' } },
  },
});

describe('send-to-tesla handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.ALLOWED_OWNERS;
    e.addressForPlace.mockResolvedValue('1 Main St');
    e.sendNavigation.mockResolvedValue(undefined);
  });

  it('sends the selected place address to the car', async () => {
    await handler({ Records: [record()] } as never);
    expect(e.addressForPlace).toHaveBeenCalledWith('p1');
    expect(e.sendNavigation).toHaveBeenCalledWith('1 Main St');
  });

  it('skips when no selection change', async () => {
    const noop = {
      eventName: 'MODIFY',
      dynamodb: {
        NewImage: { members: { L: [{ S: 'u1' }] }, selectedPlaceId: { S: 'p1' } },
        OldImage: { selectedPlaceId: { S: 'p1' } },
      },
    };
    await handler({ Records: [noop] } as never);
    expect(e.sendNavigation).not.toHaveBeenCalled();
  });

  it('skips when the address is not cached', async () => {
    e.addressForPlace.mockResolvedValue(null);
    await handler({ Records: [record()] } as never);
    expect(e.sendNavigation).not.toHaveBeenCalled();
  });

  it('respects ALLOWED_OWNERS', async () => {
    process.env.ALLOWED_OWNERS = 'someone-else';
    await handler({ Records: [record()] } as never);
    expect(e.sendNavigation).not.toHaveBeenCalled();
  });
});
