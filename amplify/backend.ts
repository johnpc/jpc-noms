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
import { pairingPushFunction } from './notify/pairingPush/resource';
import { sendToTeslaFunction } from './tesla/sendToTesla/resource';
import { pokeFunction } from './notify/poke/resource';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Noms backend.
 *
 * Secrets live in AWS Secrets Manager, referenced here by ARN. The ARN itself
 * is NOT sensitive (access is IAM-gated), so we hardcode it rather than read it
 * from .env / process.env — a build-time env var is absent in the Amplify
 * main-branch (prod) build, which is exactly why prod search once had no key.
 * Hardcoded ARNs resolve identically in sandbox and prod. Rotate a value in
 * Secrets Manager without a code change; only a new secret NAME touches code.
 */
const GOOGLE_SECRET_ARN =
  'arn:aws:secretsmanager:us-west-2:566092841021:secret:jpc-noms/google-places-4ekimt';
const TESSIE_SECRET_ARN =
  'arn:aws:secretsmanager:us-west-2:566092841021:secret:jpc-noms/tessie-pY5skf';
// APNs SNS platform application (token auth, key 9ZC2WPB5WT / team JW5SC3NYUV /
// bundle com.johncorser.noms). Hardcoded like the secret ARNs so it resolves in
// the prod build (process.env is absent there). Setting this lights up push.
const APNS_PLATFORM_ARN = 'arn:aws:sns:us-west-2:566092841021:app/APNS/NomsAPNs';
const backend = defineBackend({
  auth,
  data,
  searchPlacesFunction,
  getPlaceFunction,
  getPlaceImageFunction,
  createPairingFunction,
  acceptPairingFunction,
  nomPushFunction,
  pairingPushFunction,
  sendToTeslaFunction,
  pokeFunction,
});

const cacheTable = backend.data.resources.tables['GoogleApiCache'];
const placesFns = [
  backend.searchPlacesFunction,
  backend.getPlaceFunction,
  backend.getPlaceImageFunction,
];

for (const fn of placesFns) {
  // Google Places key comes from Secrets Manager at runtime (see googleApi.ts).
  fn.addEnvironment('GOOGLE_SECRET_ARN', GOOGLE_SECRET_ARN);
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
  fn.resources.lambda.addToRolePolicy(
    new PolicyStatement({
      actions: ['secretsmanager:GetSecretValue'],
      resources: [GOOGLE_SECRET_ARN],
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
backend.nomPushFunction.addEnvironment('APNS_PLATFORM_ARN', APNS_PLATFORM_ARN);
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

// --- Pairing push: notify BOTH members when a Pairing goes ACTIVE (a scan
// connected two people). Same Device-read + SNS-publish shape as nom-push,
// consuming the Pairing table stream. ---
const pairingPush = backend.pairingPushFunction.resources.lambda;
pairingPush.addEventSource(
  new DynamoEventSource(pairingTable, {
    startingPosition: StartingPosition.LATEST,
    batchSize: 5,
    retryAttempts: 2,
  }),
);
backend.pairingPushFunction.addEnvironment('DEVICE_TABLE_NAME', deviceTable.tableName);
backend.pairingPushFunction.addEnvironment('APNS_PLATFORM_ARN', APNS_PLATFORM_ARN);
deviceTable.grantReadData(pairingPush);
pairingPush.addToRolePolicy(
  new PolicyStatement({
    actions: ['dynamodb:Query'],
    resources: [`${deviceTable.tableArn}/index/*`],
  }),
);
pairingPush.addToRolePolicy(
  new PolicyStatement({
    actions: ['sns:CreatePlatformEndpoint', 'sns:Publish'],
    resources: ['*'],
  }),
);

// --- Poke: the pokePartner mutation resolver pushes an on-demand nudge to the
// partner's devices. Same Device-read + SNS-publish grants as the stream push
// Lambdas; no stream (it's a data resolver invoked directly). ---
const poke = backend.pokeFunction.resources.lambda;
backend.pokeFunction.addEnvironment('DEVICE_TABLE_NAME', deviceTable.tableName);
backend.pokeFunction.addEnvironment('APNS_PLATFORM_ARN', APNS_PLATFORM_ARN);
deviceTable.grantReadData(poke);
poke.addToRolePolicy(
  new PolicyStatement({
    actions: ['dynamodb:Query'],
    resources: [`${deviceTable.tableArn}/index/*`],
  }),
);
poke.addToRolePolicy(
  new PolicyStatement({
    actions: ['sns:CreatePlatformEndpoint', 'sns:Publish'],
    resources: ['*'],
  }),
);

// --- Tesla: send-to-tesla ALSO consumes the Nom stream. When a nom's
// selectedPlaceId changes to a real value (and its members are allowed), it
// reads the place address from GoogleApiCache and sets the car's nav via
// Tessie. Re-implements the recovered eats Lambda (pointed at Nom). ALLOWED_OWNERS
// empty in sandbox = allow any member; set the household's two subs in prod. ---
const tesla = backend.sendToTeslaFunction.resources.lambda;
tesla.addEventSource(
  new DynamoEventSource(nomTable, {
    startingPosition: StartingPosition.LATEST,
    batchSize: 5,
    retryAttempts: 2,
  }),
);
backend.sendToTeslaFunction.addEnvironment('CACHE_TABLE_NAME', cacheTable.tableName);
backend.sendToTeslaFunction.addEnvironment('ALLOWED_OWNERS', process.env.ALLOWED_OWNERS ?? '');
cacheTable.grantReadData(tesla);
tesla.addToRolePolicy(
  new PolicyStatement({
    actions: ['dynamodb:Query'],
    resources: [`${cacheTable.tableArn}/index/*`],
  }),
);
// SAFETY: only arm Tessie on the real (prod) backend. A `ampx sandbox` deploy
// sets AMPLIFY_DEV_ACCOUNT_ID; the prod pipeline build does not. On a sandbox
// we deliberately DON'T wire the secret ARN or the GetSecretValue grant, so
// sendNavigation() is inert (creds()→null) and an e2e that selects a nom can
// NEVER drive the physical car — even though sandbox ALLOWED_OWNERS is empty
// (= allow any member). Tessie creds live in Secrets Manager (this drives the
// car); the Lambda reads TESSIE_SECRET_ARN at runtime.
const isSandbox = !!process.env.AMPLIFY_DEV_ACCOUNT_ID;
if (!isSandbox) {
  backend.sendToTeslaFunction.addEnvironment('TESSIE_SECRET_ARN', TESSIE_SECRET_ARN);
  tesla.addToRolePolicy(
    new PolicyStatement({
      actions: ['secretsmanager:GetSecretValue'],
      resources: [TESSIE_SECRET_ARN],
    }),
  );
}
