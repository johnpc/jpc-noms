import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { searchPlacesFunction } from './places/searchPlaces/resource';
import { getPlaceFunction } from './places/getPlace/resource';
import { getPlaceImageFunction } from './places/getPlaceImage/resource';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Noms backend.
 *
 * Grows by vertical slice. This slice wires auth + data + the three Google
 * Places query resolvers. The Places Lambdas read/write the GoogleApiCache
 * table straight through their IAM role (bypassing AppSync), so each gets the
 * table name + a read/write grant, plus the Google API key from .env. Later
 * slices add the Pairing/Nom/Device models and the stream-triggered Lambdas
 * (send-to-tesla, nom-push) with their DynamoDB-stream + SNS wiring here.
 */
const backend = defineBackend({
  auth,
  data,
  searchPlacesFunction,
  getPlaceFunction,
  getPlaceImageFunction,
});

const cacheTable = backend.data.resources.tables['GoogleApiCache'];
const placesFns = [
  backend.searchPlacesFunction,
  backend.getPlaceFunction,
  backend.getPlaceImageFunction,
];

for (const fn of placesFns) {
  fn.addEnvironment('GOOGLE_PLACES_API_KEY', process.env.GOOGLE_PLACES_API_KEY ?? '');
  fn.addEnvironment('CACHE_TABLE_NAME', cacheTable.tableName);
  cacheTable.grantReadWriteData(fn.resources.lambda);
  // grantReadWriteData covers the table ARN but not its GSIs — the cache reads
  // go through the `googleApiCachesByHash` index, so grant Query/Scan on the
  // table's index ARNs explicitly (`<tableArn>/index/*`).
  fn.resources.lambda.addToRolePolicy(
    new PolicyStatement({
      actions: ['dynamodb:Query', 'dynamodb:Scan'],
      resources: [`${cacheTable.tableArn}/index/*`],
    }),
  );
}
