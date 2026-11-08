import { existsSync, readFileSync } from 'node:fs';
import {
  CognitoIdentityProviderClient,
  DescribeUserPoolCommand,
} from '@aws-sdk/client-cognito-identity-provider';

/**
 * SAFETY GUARD: e2e must ONLY run against a sandbox backend, never prod.
 * e2e writes (create pairings, select noms) would otherwise pollute the real
 * user's prod data — and a nom-select on prod could drive the physical Tesla.
 *
 * CI deploys a fresh sandbox per run, so the pool id changes every time and
 * can't be pinned. Instead we ask Cognito: Amplify tags every resource it
 * deploys with `amplify:deployment-type` (`sandbox` for `ampx sandbox`,
 * `branch` for the prod pipeline). Anything that isn't tagged `sandbox` —
 * including a pool we can't describe — is refused. Set E2E_ALLOW_ANY_BACKEND=1
 * to bypass (don't).
 */
export default async function globalSetup(): Promise<void> {
  if (process.env.E2E_ALLOW_ANY_BACKEND) return;
  if (!existsSync('amplify_outputs.json')) {
    throw new Error(
      'e2e: amplify_outputs.json missing — run `npm run e2e-config` (sandbox) first.',
    );
  }
  const outputs = JSON.parse(readFileSync('amplify_outputs.json', 'utf8')) as {
    auth?: { user_pool_id?: string; aws_region?: string };
  };
  const pool = outputs.auth?.user_pool_id;
  process.env.AWS_PROFILE ??= 'personal';
  const cognito = new CognitoIdentityProviderClient({ region: outputs.auth?.aws_region });
  const { UserPool } = await cognito.send(new DescribeUserPoolCommand({ UserPoolId: pool }));
  const type = UserPool?.UserPoolTags?.['amplify:deployment-type'];
  if (type !== 'sandbox') {
    throw new Error(
      `e2e REFUSING to run: amplify_outputs.json points at "${pool}", whose ` +
        `amplify:deployment-type is "${type}", not "sandbox". Run \`npm run e2e-config\` ` +
        `to point at a sandbox. (This guard prevents e2e writes from hitting prod / the real Tesla.)`,
    );
  }
}
