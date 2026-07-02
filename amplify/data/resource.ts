import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/**
 * Noms data schema.
 *
 * Auth contract (stoop ADR 0004): the client's `authMode` must name the same
 * provider as a model's `allow.*` rule or reads come back empty (not an error).
 * The shared data client defaults to `identityPool` (guest) and upgrades signed-in
 * users to `userPool` via readAuthMode() — see src/lib/dataClient.ts.
 *
 * This slice ships a single read model to validate the pipeline end to end;
 * search/rotation/pairing/nom models land in their own vertical slices.
 */
const schema = a.schema({
  AppInfo: a
    .model({
      key: a.string().required(),
      value: a.string().required(),
    })
    .authorization((allow) => [
      allow.guest().to(['read']),
      allow.authenticated('identityPool').to(['read']),
      allow.authenticated().to(['read']),
      allow.group('editors').to(['create', 'update', 'delete']),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'identityPool',
  },
});
