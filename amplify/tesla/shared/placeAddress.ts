/**
 * Resolve a selected place id to its street address by reading the
 * GoogleApiCache (the search/detail resolvers cache each place under its id).
 * Uses the `googleApiCachesByHash` GSI — the same lookup the recovered eats
 * sendToTesla Lambda used. Table + index injected by backend.ts. Mocked in test.
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const table = (): string => {
  const t = process.env.CACHE_TABLE_NAME;
  if (!t) throw new Error('CACHE_TABLE_NAME not set');
  return t;
};

/** The formattedAddress for a cached place id, or null if not cached / no address. */
export async function addressForPlace(placeId: string): Promise<string | null> {
  const res = await doc.send(
    new QueryCommand({
      TableName: table(),
      IndexName: 'googleApiCachesByHash',
      KeyConditionExpression: '#h = :h',
      ExpressionAttributeNames: { '#h': 'hash' },
      ExpressionAttributeValues: { ':h': placeId },
      Limit: 1,
    }),
  );
  const value = res.Items?.[0]?.value;
  if (typeof value !== 'string') return null;
  const place = JSON.parse(value) as { formattedAddress?: string };
  return place.formattedAddress ?? null;
}
