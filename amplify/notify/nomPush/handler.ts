/**
 * nom-push: DynamoDB-stream consumer on the Nom table. When a partner adds an
 * option or selects a nom, notify the OTHER member(s) via APNs. Thin — the
 * decision is a pure helper; device lookup + SNS delivery are mocked edges.
 */
import type { DynamoDBStreamEvent } from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { decideNotification, type NomImage } from '../shared/decideNotification';
import { tokensForOwner } from '../shared/devices';
import { pushToToken } from '../shared/apns';

const img = (raw: Record<string, unknown> | undefined): NomImage | undefined =>
  raw ? (unmarshall(raw as never) as NomImage) : undefined;

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  for (const record of event.Records) {
    const decision = decideNotification(
      record.eventName ?? '',
      img(record.dynamodb?.NewImage),
      img(record.dynamodb?.OldImage),
    );
    if (!decision) continue;

    const tokenLists = await Promise.all(decision.recipientSubs.map((s) => tokensForOwner(s)));
    const tokens = [...new Set(tokenLists.flat())];
    await Promise.all(tokens.map((t) => pushToToken(t, decision.title, decision.body)));
    console.log(`nom-push: notified ${tokens.length} device(s): "${decision.body}"`);
  }
};
