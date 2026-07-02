import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

/**
 * Noms backend.
 *
 * Grows by vertical slice: this slice wires auth + a minimal data model. Later
 * slices add the Google Places functions (search/get/image), the Rotation +
 * Pairing + Nom + Device models, and the stream-triggered Lambdas
 * (send-to-tesla, nom-push) with their DynamoDB-stream + SNS wiring here.
 */
defineBackend({
  auth,
  data,
});
