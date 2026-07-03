import { defineFunction } from '@aws-amplify/backend';

export const sendToTeslaFunction = defineFunction({
  name: 'send-to-tesla',
  entry: './handler.ts',
  timeoutSeconds: 30,
  runtime: 20,
  // A DynamoDB-stream consumer wired in backend.ts (not a data resolver). Gets
  // the Tessie creds + GoogleApiCache read grant there.
});
