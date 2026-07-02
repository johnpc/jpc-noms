/**
 * Idempotent seed runner. Signs in as an editor (all writes via userPool),
 * clears the seedable models, then inserts a known-good baseline so re-running
 * always converges to the same state and e2e can assert on REAL data. Grows a
 * clear + seed step per model as slices land (pairing, noms).
 *
 * Usage:
 *   npm run e2e-config   # ensure amplify_outputs.json exists (sandbox)
 *   npm run seed         # runs this script via tsx (needs .env.local creds)
 */
import { signIn, signOut } from 'aws-amplify/auth';
import { client, clearOneModel, EDITOR_WRITE } from './seedClient';
import { SEEDED_PLACES } from './fixtures/places';

async function main() {
  const username = process.env.TEST_USERNAME;
  const password = process.env.TEST_PASSWORD;
  if (!username || !password) {
    throw new Error(
      'TEST_USERNAME / TEST_PASSWORD required to seed (writes need an editor session).',
    );
  }
  await signOut().catch(() => {});
  await signIn({ username, password });

  const cleared = await clearOneModel(client.models.GoogleApiCache);
  console.log(`Cleared GoogleApiCache (${cleared} rows).`);

  // Seed each known place under its id so guest getGooglePlace + search-by-id
  // resolve without a live Google call, and e2e can assert on a real name.
  for (const place of SEEDED_PLACES) {
    await client.models.GoogleApiCache.create(
      { hash: place.id, value: JSON.stringify(place) },
      EDITOR_WRITE,
    );
  }
  console.log(`Seeded ${SEEDED_PLACES.length} places into the cache.`);

  // The test user's rotation (owner-auth): clear then add one known favorite so
  // the signed-in e2e reads a REAL saved restaurant. Owner is the signed-in
  // seed user, so these writes go through userPool.
  const clearedRotation = await clearOneModel(client.models.Rotation);
  console.log(`Cleared Rotation (${clearedRotation} rows).`);
  await client.models.Rotation.create({ googlePlaceId: SEEDED_PLACES[0].id }, EDITOR_WRITE);
  console.log('Seeded the test user rotation with 1 favorite.');

  await signOut().catch(() => {});
  console.log('Seed complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
