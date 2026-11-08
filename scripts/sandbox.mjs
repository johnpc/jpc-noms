#!/usr/bin/env node
/**
 * Per-run Amplify sandbox management (pattern from johnpc/stoop).
 *
 * WHY: CI used to read one hand-made dev sandbox, so it broke whenever that
 * sandbox was deleted or recycled, and it cost money while idle. Now every CI
 * run deploys its OWN sandbox (`ci-<run id>`), seeds it, tests against it, and
 * deletes it in a final `if: always()` job. A scheduled sweep reaps any that
 * leak. Local dev keeps using the per-user sandbox.
 *
 * Stack names are DETERMINISTIC (see @aws-amplify/platform-core):
 *   amplify-<sanitized namespace>-<name>-sandbox-<sha512(namespace + name)[:10]>
 * where namespace = package.json "name" (hashed RAW, sanitized in the name).
 * We always pass an already-sanitized identifier, so the name in the stack
 * round-trips back to the exact identifier.
 *
 * Usage:
 *   node scripts/sandbox.mjs id      [--id X]   print the resolved identifier
 *   node scripts/sandbox.mjs name    [--id X]   print the derived stack name
 *   node scripts/sandbox.mjs deploy  [--id X]   ampx sandbox --once, then verify the stack
 *   node scripts/sandbox.mjs config  [--id X]   ampx generate outputs --stack <name>
 *   node scripts/sandbox.mjs delete  [--id X]   delete the root stack, then verify it is gone
 *   node scripts/sandbox.mjs sweep   [--hours 6] [--apply]   reap leaked CI sandboxes
 *
 * Identifier resolution (first hit wins): --id flag → SANDBOX_IDENTIFIER env →
 * system user (ampx's own default, so a local `npx ampx sandbox` and
 * `npm run e2e-config` agree). All sanitized.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { userInfo } from 'node:os';

const REGION = 'us-west-2';
const PROFILE = process.env.AWS_PROFILE ?? 'personal';
const NAMESPACE = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
).name;

const sanitize = (s) => (s ?? '').replace(/[^A-Za-z0-9]/g, '');

const flag = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && i + 1 < process.argv.length ? process.argv[i + 1] : undefined;
};
const has = (name) => process.argv.includes(`--${name}`);

const resolveId = () => {
  const id = sanitize(flag('id') || process.env.SANDBOX_IDENTIFIER || userInfo().username);
  // ampx requires /^[a-zA-Z0-9-]{1,15}$/. Fail loudly rather than truncate, so a
  // CI id can never silently stop matching the sweep's `ci<digits>` shape.
  if (!id || id.length > 15) throw new Error(`sandbox: bad identifier "${id}" (1-15 alnum)`);
  return id;
};

/** Deterministic stack name for an identifier (matches ampx exactly). */
const stackName = (id) => {
  const hash = createHash('sha512').update(NAMESPACE).update(id).digest('hex').slice(0, 10);
  return ['amplify', sanitize(NAMESPACE), id.slice(0, 50), 'sandbox', hash].join('-');
};

const npx = (args) => execFileSync('npx', args, { stdio: 'inherit' });
const aws = (args) =>
  execFileSync('aws', [...args, '--region', REGION, '--profile', PROFILE], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

/** Root stack status, or null when the stack does not exist. */
const stackStatus = (name) => {
  try {
    return JSON.parse(
      aws(['cloudformation', 'describe-stacks', '--stack-name', name, '--output', 'json']),
    ).Stacks[0].StackStatus;
  } catch (err) {
    if (`${err.stderr ?? ''}`.includes('does not exist')) return null;
    throw err;
  }
};

// `ampx sandbox --once` can exit 0 over a rolled-back stack (stoop hit this),
// so trust the stack's own status rather than the exit code.
const HEALTHY = ['CREATE_COMPLETE', 'UPDATE_COMPLETE'];

const deploy = (id) => {
  npx(['ampx', 'sandbox', '--once', '--identifier', id, '--profile', PROFILE]);
  const name = stackName(id);
  const status = stackStatus(name);
  if (!HEALTHY.includes(status ?? '')) {
    throw new Error(`sandbox: ${name} is ${status ?? 'missing'} after deploy`);
  }
  console.log(`sandbox: ${name} is ${status}`);
};

const config = (id) =>
  npx(['ampx', 'generate', 'outputs', '--stack', stackName(id), '--profile', PROFILE]);

/**
 * Delete, then PROVE it is gone. A stack that never got created (the deploy
 * failed early) is success; a stack still present afterwards fails the job, so
 * a leak turns the run red instead of silently costing money.
 */
const remove = (id) => {
  const name = stackName(id);
  if (stackStatus(name) === null) {
    console.log(`sandbox: ${name} does not exist — nothing to delete.`);
    return;
  }
  // Straight CloudFormation (what `ampx sandbox delete` does under the hood):
  // needs only the aws CLI, not node_modules, so teardown works even when the
  // run failed at `npm ci`.
  aws(['cloudformation', 'delete-stack', '--stack-name', name]);
  aws(['cloudformation', 'wait', 'stack-delete-complete', '--stack-name', name]);
  const after = stackStatus(name);
  if (after !== null && after !== 'DELETE_COMPLETE') {
    throw new Error(`sandbox: ${name} is still ${after} after delete`);
  }
  console.log(`sandbox: ${name} deleted.`);
};

// CI sandboxes are `ci-<github.run_id>` → sanitized `ci<digits>`. The sweep
// acts ONLY on root stacks whose name is exactly the derived name for such an
// id; dev sandboxes, `main-branch` prod stacks and anything else never match.
const CI_ID = /^ci\d+$/;

/** Delete leaked CI sandboxes created more than --hours ago (default 6). Dry-run unless --apply. */
const sweep = () => {
  const hours = Number(flag('hours') ?? 6);
  const cutoff = Date.now() - hours * 3_600_000;
  const out = aws([
    'cloudformation',
    'describe-stacks',
    '--query',
    'Stacks[?ParentId==null].{name:StackName,created:CreationTime}',
    '--output',
    'json',
  ]);
  const rootRe = new RegExp(`^amplify-${sanitize(NAMESPACE)}-([A-Za-z0-9]+)-sandbox-[a-f0-9]{10}$`);
  const stale = JSON.parse(out)
    .map((s) => ({ ...s, id: s.name.match(rootRe)?.[1] }))
    .filter((s) => s.id && CI_ID.test(s.id) && s.name === stackName(s.id))
    .filter((s) => Date.parse(s.created) < cutoff);
  if (!stale.length) {
    console.log(`sweep: no CI sandboxes older than ${hours}h.`);
    return;
  }
  for (const s of stale) {
    console.log(`${has('apply') ? 'DELETING' : 'would delete'} ${s.name} (created ${s.created})`);
    if (has('apply')) remove(s.id);
  }
};

const cmd = process.argv[2];
const actions = {
  id: () => console.log(resolveId()),
  name: () => console.log(stackName(resolveId())),
  deploy: () => deploy(resolveId()),
  config: () => config(resolveId()),
  delete: () => remove(resolveId()),
  sweep,
};
if (!actions[cmd]) {
  console.error(`Unknown command "${cmd ?? ''}". One of: ${Object.keys(actions).join(', ')}`);
  process.exit(1);
}
actions[cmd]();
