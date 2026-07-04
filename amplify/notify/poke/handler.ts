/**
 * pokePartner mutation resolver: an on-demand nudge. The signed-in caller pokes
 * their partner (partnerSub) — we look up the partner's device tokens and push
 * a notification. Reuses the same device-lookup + APNs edges as the stream push
 * Lambdas. Returns the number of devices notified. Thin — decision + edges are
 * mocked in the test.
 */
import type { Schema } from '../../data/resource';
import { callerSub } from '../../pairing/shared/identity';
import { tokensForOwner } from '../shared/devices';
import { pushToToken } from '../shared/apns';
import { decidePoke } from '../shared/decidePoke';

export const handler: Schema['pokePartner']['functionHandler'] = async (event) => {
  callerSub(event.identity as Parameters<typeof callerSub>[0]); // require a signed-in caller
  const partnerSub = event.arguments.partnerSub;
  if (!partnerSub) return 0;

  const { title, body } = decidePoke(event.arguments.fromLabel ?? undefined);
  const tokens = [...new Set(await tokensForOwner(partnerSub))];
  await Promise.all(tokens.map((t) => pushToToken(t, title, body)));
  console.log(`poke: notified ${tokens.length} device(s)`);
  return tokens.length;
};
