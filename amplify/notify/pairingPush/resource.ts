import { defineFunction } from '@aws-amplify/backend';

export const pairingPushFunction = defineFunction({
  name: 'pairing-push',
  entry: './handler.ts',
  timeoutSeconds: 30,
  runtime: 20,
});
