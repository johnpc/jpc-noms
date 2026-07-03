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
import { signIn, signOut, getCurrentUser } from 'aws-amplify/auth';
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

  // Clear pairings so the test user starts unpaired (the invite e2e asserts the
  // invite form, which only shows when unpaired).
  const clearedPairings = await clearOneModel(client.models.Pairing);
  console.log(`Cleared Pairing (${clearedPairings} rows).`);

  // Seed one shared nom the test user is a member of, with a seeded option, so
  // the collaborative-noms e2e reads a REAL nom (honest read of multi-owner
  // data). The test user's sub is resolved from the signed-in session.
  const clearedNoms = await clearOneModel(client.models.Nom);
  console.log(`Cleared Nom (${clearedNoms} rows).`);
  const me = (await getCurrentUser()).userId;
  await client.models.Nom.create(
    {
      pairingId: 'seed-pairing',
      members: [me],
      title: 'Date night',
      optionPlaceIds: [SEEDED_PLACES[1].id],
      status: 'OPEN',
    },
    EDITOR_WRITE,
  );
  console.log('Seeded 1 shared nom (Date night) with 1 option.');

  await signOut().catch(() => {});
  console.log('Seed complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
