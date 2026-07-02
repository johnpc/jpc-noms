import { describe, it, expect, vi, beforeEach } from 'vitest';

const send = vi.hoisted(() => vi.fn());
vi.mock('@aws-sdk/client-dynamodb', () => ({ DynamoDBClient: vi.fn() }));
vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: () => ({ send }) },
  PutCommand: vi.fn((input) => ({ kind: 'put', input })),
  QueryCommand: vi.fn((input) => ({ kind: 'query', input })),
}));

import { readCache, writeCache } from './cache';

describe('cache edges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CACHE_TABLE_NAME = 'cacheTable';
  });

  it('readCache returns the value string on a hit', async () => {
    send.mockResolvedValue({ Items: [{ value: '{"id":"p1"}' }] });
    expect(await readCache('p1')).toBe('{"id":"p1"}');
    const cmd = send.mock.calls[0][0].input;
    expect(cmd.IndexName).toBe('googleApiCachesByHash');
    expect(cmd.ExpressionAttributeValues).toEqual({ ':h': 'p1' });
  });

  it('readCache returns null on a miss', async () => {
    send.mockResolvedValue({ Items: [] });
    expect(await readCache('nope')).toBeNull();
  });

  it('writeCache puts a GoogleApiCache item with hash + value', async () => {
    send.mockResolvedValue({});
    await writeCache('p2', '{"id":"p2"}', 'src');
    const item = send.mock.calls[0][0].input.Item;
    expect(item).toMatchObject({
      __typename: 'GoogleApiCache',
      hash: 'p2',
      value: '{"id":"p2"}',
      source: 'src',
    });
    expect(item.id).toBeTruthy();
  });

  it('throws when CACHE_TABLE_NAME is unset', async () => {
    delete process.env.CACHE_TABLE_NAME;
    await expect(readCache('x')).rejects.toThrow('CACHE_TABLE_NAME not set');
  });
});
