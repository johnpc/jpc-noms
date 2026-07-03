import { describe, it, expect, vi, beforeEach } from 'vitest';

const send = vi.hoisted(() => vi.fn());
vi.mock('@aws-sdk/client-dynamodb', () => ({ DynamoDBClient: vi.fn() }));
vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: () => ({ send }) },
  QueryCommand: vi.fn((input) => ({ input })),
}));

import { addressForPlace } from './placeAddress';

describe('addressForPlace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CACHE_TABLE_NAME = 'cache';
  });

  it('returns the formattedAddress from the cached place', async () => {
    send.mockResolvedValue({
      Items: [{ value: JSON.stringify({ formattedAddress: '1 Main St' }) }],
    });
    expect(await addressForPlace('p1')).toBe('1 Main St');
    expect(send.mock.calls[0][0].input.IndexName).toBe('googleApiCachesByHash');
  });

  it('returns null on a cache miss', async () => {
    send.mockResolvedValue({ Items: [] });
    expect(await addressForPlace('p1')).toBeNull();
  });

  it('returns null when the cached place has no address', async () => {
    send.mockResolvedValue({ Items: [{ value: JSON.stringify({ id: 'p1' }) }] });
    expect(await addressForPlace('p1')).toBeNull();
  });

  it('throws when CACHE_TABLE_NAME is unset', async () => {
    delete process.env.CACHE_TABLE_NAME;
    await expect(addressForPlace('p1')).rejects.toThrow('CACHE_TABLE_NAME not set');
  });
});
