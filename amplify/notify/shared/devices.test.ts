import { describe, it, expect, vi, beforeEach } from 'vitest';

const send = vi.hoisted(() => vi.fn());
vi.mock('@aws-sdk/client-dynamodb', () => ({ DynamoDBClient: vi.fn() }));
vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: () => ({ send }) },
  QueryCommand: vi.fn((input) => ({ input })),
}));

import { tokensForOwner } from './devices';

describe('tokensForOwner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DEVICE_TABLE_NAME = 'devices';
  });

  it('queries the ownerSub GSI and returns tokens', async () => {
    send.mockResolvedValue({ Items: [{ token: 't1' }, { token: 't2' }, {}] });
    expect(await tokensForOwner('u2')).toEqual(['t1', 't2']);
    const cmd = send.mock.calls[0][0].input;
    expect(cmd.IndexName).toBe('devicesByOwnerSub');
    expect(cmd.ExpressionAttributeValues).toEqual({ ':o': 'u2' });
  });

  it('returns [] when the owner has no devices', async () => {
    send.mockResolvedValue({ Items: [] });
    expect(await tokensForOwner('u3')).toEqual([]);
  });

  it('throws when DEVICE_TABLE_NAME is unset', async () => {
    delete process.env.DEVICE_TABLE_NAME;
    await expect(tokensForOwner('u1')).rejects.toThrow('DEVICE_TABLE_NAME not set');
  });
});
