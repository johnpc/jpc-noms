/** Shared Amplify client + helpers for the seed runner. */
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { Schema } from '../data/resource';

const here = dirname(fileURLToPath(import.meta.url));
const outputs = JSON.parse(readFileSync(resolve(here, '../../amplify_outputs.json'), 'utf8'));

Amplify.configure(outputs);
export const client = generateClient<Schema>({ authMode: 'identityPool' });

// The seed signs in as a member of the 'editors' group. Group membership
// remaps the identity-pool IAM role, so ALL writes must go through userPool
// (not the client's default identityPool) to be authorized. See stoop ADR 0004.
export const EDITOR_WRITE = { authMode: 'userPool' } as const;

// Load TEST_USERNAME/TEST_PASSWORD from .env.local if not already in the env.
const envLocal = resolve(here, '../../.env.local');
if (existsSync(envLocal)) {
  for (const line of readFileSync(envLocal, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

/** Minimal shape of an Amplify model needed to wipe it generically. */
interface ClearableModel {
  list: (opts: {
    limit: number;
    nextToken?: string;
    authMode: typeof EDITOR_WRITE.authMode;
  }) => Promise<{ data: ({ id: string } | null)[]; nextToken?: string | null }>;
  delete: (id: { id: string }, opts: typeof EDITOR_WRITE) => Promise<unknown>;
}

/**
 * Delete every row of one model, paginating through ALL pages (a single list()
 * returns only the first page). Both list AND delete use userPool: the seed
 * runs as a signed-in editor, who can't read/write via the identity-pool role.
 */
export async function clearOneModel(model: ClearableModel): Promise<number> {
  let removed = 0;
  let token: string | undefined;
  do {
    const { data, nextToken } = await model.list({
      limit: 1000,
      nextToken: token,
      ...EDITOR_WRITE,
    });
    const rows = data.filter((row): row is { id: string } => !!row?.id);
    await Promise.all(rows.map((row) => model.delete({ id: row.id }, EDITOR_WRITE)));
    removed += rows.length;
    token = nextToken ?? undefined;
  } while (token);
  return removed;
}
