/**
 * The fake data client's auth contract (stoop ADR 0004 in miniature): who may
 * read a model's rows, and when a call must have a session.
 */
import type { Row } from './db';
import { currentSessionSub } from './session';

/** Who may read rows: anyone / any signed-in user / the `owner` / a `members` entry. */
export type ReadRule = 'guest' | 'authenticated' | 'owner' | 'members';
export interface AuthOpts {
  authMode?: 'userPool' | 'identityPool';
}

export interface Result<T> {
  data: T;
  nextToken?: string | null;
}

export function requireSession(opts?: AuthOpts): string | null {
  const sub = currentSessionSub();
  if (opts?.authMode === 'userPool' && !sub) throw new Error('No current user');
  return sub;
}

export function visibleRows(rows: Row[], rule: ReadRule, sub: string | null): Row[] {
  if (rule === 'guest') return rows;
  if (!sub) return [];
  if (rule === 'authenticated') return rows;
  if (rule === 'owner') return rows.filter((r) => r.owner === sub);
  return rows.filter((r) => (r.members as string[] | undefined)?.includes(sub));
}
