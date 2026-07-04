import { defineFunction } from '@aws-amplify/backend';

export const pokeFunction = defineFunction({
  name: 'poke',
  entry: './handler.ts',
  timeoutSeconds: 30,
  runtime: 20,
  // Data resolver for the pokePartner mutation; gets Device read + SNS publish
  // grants in backend.ts. Same stack as data to avoid a data<->function cycle.
  resourceGroupName: 'data',
});
