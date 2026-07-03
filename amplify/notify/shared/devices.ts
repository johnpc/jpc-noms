/**
 * Device-token lookup for the push Lambda. Reads the Device table via the
 * `devicesByOwnerSub` GSI using the function's IAM role. Table name + region
 * injected by backend.ts. Mocked in the handler test.
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const INDEX = 'devicesByOwnerSub';

const table = (): string => {
  const t = process.env.DEVICE_TABLE_NAME;
  if (!t) throw new Error('DEVICE_TABLE_NAME not set');
  return t;
};

/** All APNs device tokens registered by a given owner sub. */
export async function tokensForOwner(ownerSub: string): Promise<string[]> {
  const res = await doc.send(
    new QueryCommand({
      TableName: table(),
      IndexName: INDEX,
      KeyConditionExpression: '#o = :o',
      ExpressionAttributeNames: { '#o': 'ownerSub' },
      ExpressionAttributeValues: { ':o': ownerSub },
    }),
  );
  return (res.Items ?? [])
    .map((i) => i.token as string | undefined)
    .filter((t): t is string => !!t);
}
