/**
 * pairing-push: DynamoDB-stream consumer on the Pairing table. When two people
 * connect (a Pairing goes ACTIVE), notify BOTH members via APNs. Thin — the
 * decision is a pure helper; device lookup + SNS delivery are mocked edges.
 */
import type { DynamoDBStreamEvent } from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { decidePairingNotification, type PairingImage } from '../shared/decidePairingNotification';
import { tokensForOwner } from '../shared/devices';
import { pushToToken } from '../shared/apns';

const img = (raw: Record<string, unknown> | undefined): PairingImage | undefined =>
  raw ? (unmarshall(raw as never) as PairingImage) : undefined;

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  for (const record of event.Records) {
    const decision = decidePairingNotification(
      record.eventName ?? '',
      img(record.dynamodb?.NewImage),
      img(record.dynamodb?.OldImage),
    );
    if (!decision) continue;

    const tokenLists = await Promise.all(decision.recipientSubs.map((s) => tokensForOwner(s)));
    const tokens = [...new Set(tokenLists.flat())];
    await Promise.all(tokens.map((t) => pushToToken(t, decision.title, decision.body)));
    console.log(`pairing-push: notified ${tokens.length} device(s): "${decision.body}"`);
  }
};
