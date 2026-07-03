/**
 * Pairing table DynamoDB edges. The pairing Lambdas write straight to the
 * Amplify-managed table via their IAM role (bypassing AppSync), so they set the
 * Amplify metadata (__typename, id, timestamps). Table name + GSI injected by
 * backend.ts. Mocked in handler tests.
 */
import { randomUUID } from 'node:crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const table = (): string => {
  const t = process.env.PAIRING_TABLE_NAME;
  if (!t) throw new Error('PAIRING_TABLE_NAME not set');
  return t;
};

export interface PairingRow {
  id: string;
  members: string[];
  inviterEmail: string;
  inviteeEmail: string;
  status: 'PENDING' | 'ACTIVE';
  createdAt: string;
  updatedAt: string;
}

/** Create a PENDING pairing owned by the inviter. Returns the stored row. */
export async function putPending(input: {
  inviterSub: string;
  inviterEmail: string;
  inviteeEmail: string;
}): Promise<PairingRow> {
  const now = new Date().toISOString();
  const row: PairingRow = {
    id: randomUUID(),
    members: [input.inviterSub],
    inviterEmail: input.inviterEmail,
    inviteeEmail: input.inviteeEmail,
    status: 'PENDING',
    createdAt: now,
    updatedAt: now,
  };
  await doc.send(new PutCommand({ TableName: table(), Item: { __typename: 'Pairing', ...row } }));
  return row;
}

/** Fetch a pairing by id, or null if absent. */
export async function getPairing(id: string): Promise<PairingRow | null> {
  const res = await doc.send(new GetCommand({ TableName: table(), Key: { id } }));
  return (res.Item as PairingRow) ?? null;
}

/** Add `sub` to members and flip status to ACTIVE. Returns the updated row. */
export async function activate(id: string, sub: string, members: string[]): Promise<PairingRow> {
  const now = new Date().toISOString();
  const nextMembers = members.includes(sub) ? members : [...members, sub];
  const res = await doc.send(
    new UpdateCommand({
      TableName: table(),
      Key: { id },
      UpdateExpression: 'SET #m = :m, #s = :s, #u = :u',
      ExpressionAttributeNames: { '#m': 'members', '#s': 'status', '#u': 'updatedAt' },
      ExpressionAttributeValues: { ':m': nextMembers, ':s': 'ACTIVE', ':u': now },
      ReturnValues: 'ALL_NEW',
    }),
  );
  return res.Attributes as PairingRow;
}
