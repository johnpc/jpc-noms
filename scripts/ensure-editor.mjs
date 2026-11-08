#!/usr/bin/env node
/**
 * `npm run ensure-editor` — idempotently create the seed/e2e Cognito account.
 *
 * Every CI run deploys a brand-new sandbox with an EMPTY user pool, so the
 * TEST_USERNAME account the seed and e2e sign in as doesn't exist yet. This
 * creates it (no invite email), sets TEST_PASSWORD as its permanent password
 * (which also confirms it), and adds it to `editors` — each step a no-op when
 * already satisfied, so re-running against an existing pool writes nothing.
 *
 * Reads the pool + region from amplify_outputs.json (run `npm run e2e-config`
 * first) and TEST_USERNAME/TEST_PASSWORD from the env or .env.local.
 */
import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminListGroupsForUserCommand,
  AdminAddUserToGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { existsSync, readFileSync } from 'node:fs';

process.env.AWS_PROFILE ??= 'personal';

if (existsSync('.env.local'))
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }

const { auth } = JSON.parse(readFileSync('amplify_outputs.json', 'utf8'));
const UserPoolId = auth.user_pool_id;
const Username = process.env.TEST_USERNAME;
const Password = process.env.TEST_PASSWORD;
if (!Username || !Password) throw new Error('TEST_USERNAME / TEST_PASSWORD required.');
const GROUP = 'editors';
const cognito = new CognitoIdentityProviderClient({ region: auth.aws_region });

/** Cognito account status, or null when the user does not exist yet. */
async function currentStatus() {
  try {
    const u = await cognito.send(new AdminGetUserCommand({ UserPoolId, Username }));
    return u.UserStatus ?? 'UNKNOWN';
  } catch (e) {
    if (e?.name === 'UserNotFoundException') return null;
    throw e;
  }
}

const changes = [];
const status = await currentStatus();
if (status === null) {
  await cognito.send(
    new AdminCreateUserCommand({
      UserPoolId,
      Username,
      MessageAction: 'SUPPRESS',
      UserAttributes: [
        { Name: 'email', Value: Username },
        { Name: 'email_verified', Value: 'true' },
      ],
    }),
  );
  changes.push('created user');
}
if (status !== 'CONFIRMED') {
  await cognito.send(
    new AdminSetUserPasswordCommand({ UserPoolId, Username, Password, Permanent: true }),
  );
  changes.push('set permanent password');
}
const { Groups } = await cognito.send(new AdminListGroupsForUserCommand({ UserPoolId, Username }));
if (!(Groups ?? []).some((g) => g.GroupName === GROUP)) {
  await cognito.send(new AdminAddUserToGroupCommand({ UserPoolId, Username, GroupName: GROUP }));
  changes.push(`added to ${GROUP}`);
}
console.log(
  changes.length
    ? `ensure-editor: ${changes.join(', ')} in ${UserPoolId}.`
    : `ensure-editor: already confirmed and in ${GROUP} in ${UserPoolId} — no-op.`,
);
