/**
 * send-to-tesla: DynamoDB-stream consumer on the Nom table. When a nom's
 * selectedPlaceId changes to a real value (and its members are the allowed
 * household), look up the place's address in the GoogleApiCache and set the
 * Tesla's navigation via Tessie. Re-implements the recovered jpc-eats Lambda,
 * pointed at Nom instead of Choice. Thin — decision is a pure helper; the cache
 * + Tessie edges are mocked in the test.
 */
import type { DynamoDBStreamEvent } from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { decideNav, type NavImage } from '../shared/decideNav';
import { addressForPlace } from '../shared/placeAddress';
import { sendNavigation } from '../shared/tessie';

const allowed = (): string[] =>
  (process.env.ALLOWED_OWNERS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const img = (raw: Record<string, unknown> | undefined): NavImage | undefined =>
  raw ? (unmarshall(raw as never) as NavImage) : undefined;

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  const allowedOwners = allowed();
  for (const record of event.Records) {
    const placeId = decideNav(
      record.eventName ?? '',
      img(record.dynamodb?.NewImage),
      img(record.dynamodb?.OldImage),
      allowedOwners,
    );
    if (!placeId) continue;

    const address = await addressForPlace(placeId);
    if (!address) {
      console.log(`send-to-tesla: no cached address for ${placeId}`);
      continue;
    }
    await sendNavigation(address);
  }
};
