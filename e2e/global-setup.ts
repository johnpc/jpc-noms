import { existsSync, readFileSync } from 'node:fs';

/**
 * SAFETY GUARD: e2e must ONLY run against the sandbox backend, never prod.
 * e2e writes (create pairings, select noms) would otherwise pollute the real
 * user's prod data — and a nom-select on prod could drive the physical Tesla.
 *
 * The sandbox Cognito pool id is pinned here; if amplify_outputs.json points
 * anywhere else (e.g. someone ran `npm run prod-config`), we refuse to run.
 * Re-pin after a sandbox recycle. Set E2E_ALLOW_ANY_BACKEND=1 to bypass (don't).
 */
const SANDBOX_USER_POOL_ID = 'us-west-2_w82k8IVv5';

export default function globalSetup(): void {
  if (process.env.E2E_ALLOW_ANY_BACKEND) return;
  if (!existsSync('amplify_outputs.json')) {
    throw new Error(
      'e2e: amplify_outputs.json missing — run `npm run e2e-config` (sandbox) first.',
    );
  }
  const outputs = JSON.parse(readFileSync('amplify_outputs.json', 'utf8')) as {
    auth?: { user_pool_id?: string };
  };
  const pool = outputs.auth?.user_pool_id;
  if (pool !== SANDBOX_USER_POOL_ID) {
    throw new Error(
      `e2e REFUSING to run: amplify_outputs.json points at "${pool}", not the sandbox ` +
        `pool "${SANDBOX_USER_POOL_ID}". Run \`npm run e2e-config\` to point at the sandbox. ` +
        `(This guard prevents e2e writes from hitting prod / the real Tesla.)`,
    );
  }
}
