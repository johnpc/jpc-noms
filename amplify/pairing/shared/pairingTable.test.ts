import { describe, it, expect, vi, beforeEach } from 'vitest';

const send = vi.hoisted(() => vi.fn());
vi.mock('@aws-sdk/client-dynamodb', () => ({ DynamoDBClient: vi.fn() }));
vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: () => ({ send }) },
  PutCommand: vi.fn((input) => ({ kind: 'put', input })),
  GetCommand: vi.fn((input) => ({ kind: 'get', input })),
  UpdateCommand: vi.fn((input) => ({ kind: 'update', input })),
}));

import { putPending, getPairing, activate } from './pairingTable';

describe('pairingTable edges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PAIRING_TABLE_NAME = 'pairings';
  });

  it('putPending stores a PENDING row with the inviter as the only member', async () => {
    send.mockResolvedValue({});
    const row = await putPending({
      inviterSub: 'u1',
      inviterEmail: 'a@x.com',
      inviteeEmail: 'b@x.com',
    });
    expect(row.status).toBe('PENDING');
    expect(row.members).toEqual(['u1']);
    const item = send.mock.calls[0][0].input.Item;
    expect(item).toMatchObject({ __typename: 'Pairing', inviteeEmail: 'b@x.com' });
  });

  it('getPairing returns the item or null', async () => {
    send.mockResolvedValueOnce({ Item: { id: 'p1' } });
    expect(await getPairing('p1')).toEqual({ id: 'p1' });
    send.mockResolvedValueOnce({});
    expect(await getPairing('nope')).toBeNull();
  });

  it('activate adds the sub and flips to ACTIVE', async () => {
    send.mockResolvedValue({ Attributes: { id: 'p1', status: 'ACTIVE', members: ['u1', 'u2'] } });
    const row = await activate('p1', 'u2', ['u1']);
    expect(row.status).toBe('ACTIVE');
    const cmd = send.mock.calls[0][0].input;
    expect(cmd.ExpressionAttributeValues[':m']).toEqual(['u1', 'u2']);
    expect(cmd.ExpressionAttributeValues[':s']).toBe('ACTIVE');
  });

  it('activate does not duplicate an existing member', async () => {
    send.mockResolvedValue({ Attributes: {} });
    await activate('p1', 'u1', ['u1']);
    expect(send.mock.calls[0][0].input.ExpressionAttributeValues[':m']).toEqual(['u1']);
  });
});
