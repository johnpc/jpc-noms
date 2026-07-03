import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { searchPlacesFunction } from './places/searchPlaces/resource';
import { getPlaceFunction } from './places/getPlace/resource';
import { getPlaceImageFunction } from './places/getPlaceImage/resource';
import { createPairingFunction } from './pairing/createPairing/resource';
import { acceptPairingFunction } from './pairing/acceptPairing/resource';
import { nomPushFunction } from './notify/nomPush/resource';
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
  createPairingFunction,
  acceptPairingFunction,
  nomPushFunction,
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

// Pairing Lambdas: they read/write the Pairing table (invitee joins a
// multi-owner row they don't yet own) via their IAM role.
const pairingTable = backend.data.resources.tables['Pairing'];
for (const fn of [backend.createPairingFunction, backend.acceptPairingFunction]) {
  fn.addEnvironment('PAIRING_TABLE_NAME', pairingTable.tableName);
  pairingTable.grantReadWriteData(fn.resources.lambda);
  fn.resources.lambda.addToRolePolicy(
    new PolicyStatement({
      actions: ['dynamodb:Query', 'dynamodb:Scan'],
      resources: [`${pairingTable.tableArn}/index/*`],
    }),
  );
}

// --- Push: nom-push consumes the Nom table stream and notifies the OTHER
// member(s) via APNs (SNS). It reads Device tokens (by ownerSub GSI) and
// publishes to the APNs SNS platform application. The platform-app ARN is set
// once the Apple push key is wired (APNS_PLATFORM_ARN) — until then the apns
// edge no-ops, so the pipeline is deployable + testable but inert. ---
const nomTable = backend.data.resources.tables['Nom'];
const deviceTable = backend.data.resources.tables['Device'];
const push = backend.nomPushFunction.resources.lambda;

push.addEventSource(
  new DynamoEventSource(nomTable, {
    startingPosition: StartingPosition.LATEST,
    batchSize: 5,
    retryAttempts: 2,
  }),
);
backend.nomPushFunction.addEnvironment('DEVICE_TABLE_NAME', deviceTable.tableName);
backend.nomPushFunction.addEnvironment('APNS_PLATFORM_ARN', process.env.APNS_PLATFORM_ARN ?? '');
deviceTable.grantReadData(push);
push.addToRolePolicy(
  new PolicyStatement({
    actions: ['dynamodb:Query'],
    resources: [`${deviceTable.tableArn}/index/*`],
  }),
);
push.addToRolePolicy(
  new PolicyStatement({
    actions: ['sns:CreatePlatformEndpoint', 'sns:Publish'],
    resources: ['*'],
  }),
);
