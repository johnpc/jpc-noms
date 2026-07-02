/**
 * Idempotent seed runner. Signs in as an editor (all writes via userPool),
 * clears every model, then inserts a known-good baseline so re-running always
 * converges to the same state. Grows a clear + seed step per model as slices
 * land (rotation, pairing, noms).
 *
 * Usage:
 *   npm run e2e-config   # ensure amplify_outputs.json exists (sandbox)
 *   npm run seed         # runs this script via tsx (needs .env.local creds)
 */
import { signIn, signOut } from 'aws-amplify/auth';
import { client, clearOneModel, EDITOR_WRITE } from './seedClient';

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

  const cleared = await clearOneModel(client.models.AppInfo);
  console.log(`Cleared AppInfo (${cleared} rows).`);

  await client.models.AppInfo.create(
    { key: 'tagline', value: 'Pick where to eat, together.' },
    EDITOR_WRITE,
  );

  await signOut().catch(() => {});
  console.log('Seed complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
