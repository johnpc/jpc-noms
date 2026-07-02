/**
 * GoogleApiCache access for the Places Lambdas. Writes go straight to the
 * Amplify-managed DynamoDB table via the function's IAM role (bypassing
 * AppSync), so we set the Amplify metadata (__typename, id, timestamps)
 * ourselves. Reads use the `googleApiCachesByHash` GSI — the same index the
 * Tesla-nav Lambda queries to turn a selected place id into an address.
 * Table name + GSI are injected by backend.ts. Mocked in handler tests.
 */
import { randomUUID } from 'node:crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const HASH_INDEX = 'googleApiCachesByHash';

const table = (): string => {
  const t = process.env.CACHE_TABLE_NAME;
  if (!t) throw new Error('CACHE_TABLE_NAME not set');
  return t;
};

/** The cached `value` string for a hash, or null on a miss. */
export async function readCache(hash: string): Promise<string | null> {
  const res = await doc.send(
    new QueryCommand({
      TableName: table(),
      IndexName: HASH_INDEX,
      KeyConditionExpression: '#h = :h',
      ExpressionAttributeNames: { '#h': 'hash' },
      ExpressionAttributeValues: { ':h': hash },
      Limit: 1,
    }),
  );
  const item = res.Items?.[0];
  return typeof item?.value === 'string' ? item.value : null;
}

/** Upsert a cache row for `hash` with a JSON `value` (and optional `source`). */
export async function writeCache(hash: string, value: string, source?: string): Promise<void> {
  const now = new Date().toISOString();
  await doc.send(
    new PutCommand({
      TableName: table(),
      Item: {
        id: randomUUID(),
        __typename: 'GoogleApiCache',
        hash,
        value,
        ...(source ? { source } : {}),
        createdAt: now,
        updatedAt: now,
      },
    }),
  );
}
