import { defineFunction } from '@aws-amplify/backend';

export const getPlaceFunction = defineFunction({
  name: 'get-google-place',
  entry: './handler.ts',
  timeoutSeconds: 60,
  runtime: 20,
  // Same stack as data (resolver + GoogleApiCache grant) — avoids a
  // data<->function circular dependency.
  resourceGroupName: 'data',
});
