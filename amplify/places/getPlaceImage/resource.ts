import { defineFunction } from '@aws-amplify/backend';

export const getPlaceImageFunction = defineFunction({
  name: 'get-google-place-image',
  entry: './handler.ts',
  timeoutSeconds: 60,
  runtime: 20,
  // Same stack as data (resolver + GoogleApiCache grant) — avoids a
  // data<->function circular dependency.
  resourceGroupName: 'data',
});
