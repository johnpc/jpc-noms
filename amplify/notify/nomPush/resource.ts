import { defineFunction } from '@aws-amplify/backend';

export const nomPushFunction = defineFunction({
  name: 'nom-push',
  entry: './handler.ts',
  timeoutSeconds: 30,
  runtime: 20,
  // Not a data resolver — a DynamoDB-stream consumer wired in backend.ts. Keep
  // it out of the data stack; it gets Device read + SNS publish grants there.
});
