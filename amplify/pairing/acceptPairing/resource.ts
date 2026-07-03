import { defineFunction } from '@aws-amplify/backend';

export const acceptPairingFunction = defineFunction({
  name: 'accept-pairing',
  entry: './handler.ts',
  timeoutSeconds: 30,
  runtime: 20,
  // Data resolver + Pairing table grant — same stack as data to avoid a
  // data<->function circular dependency.
  resourceGroupName: 'data',
});
