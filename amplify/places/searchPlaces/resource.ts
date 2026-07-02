import { defineFunction } from '@aws-amplify/backend';

export const searchPlacesFunction = defineFunction({
  name: 'search-google-places',
  entry: './handler.ts',
  timeoutSeconds: 60,
  runtime: 20,
  // Same stack as data — the fn is a data resolver AND gets a grant on the
  // GoogleApiCache table, which would otherwise be a data<->function circular
  // dependency CloudFormation rejects.
  resourceGroupName: 'data',
});
