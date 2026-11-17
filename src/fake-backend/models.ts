/**
 * Generic model API for the fake data client: the subset of an Amplify Gen2
 * model (list / get / create / update / delete / on*) the app uses, with the
 * SAME auth contract as the real schema (stoop ADR 0004): a guest reading an
 * owner model gets EMPTY data, not an error; a userPool call with no session
 * throws like the SDK does.
 */
import { emit, nextId, onChange, saveDb, loadDb, table, type ChangeKind, type Row } from './db';
import {
  requireSession,
  visibleRows,
  type AuthOpts,
  type ReadRule,
  type Result,
} from './modelAuth';

export type { AuthOpts, ReadRule, Result } from './modelAuth';

function subscription(model: string, kind: ChangeKind) {
  return (_opts?: AuthOpts) => ({
    subscribe: (obs: { next: (row: Row) => void; error?: (e: unknown) => void }) => {
      const off = onChange(model, kind, obs.next);
      return { unsubscribe: off };
    },
  });
}

export function modelApi(model: string, rule: ReadRule) {
  const rows = () => table(model);
  const persist = () => saveDb(loadDb());
  return {
    list: async (
      opts?: AuthOpts & { nextToken?: string; limit?: number },
    ): Promise<Result<Row[]>> => ({
      data: visibleRows(rows(), rule, requireSession(opts)),
      nextToken: null,
    }),
    get: async ({ id }: { id: string }, opts?: AuthOpts): Promise<Result<Row | null>> => ({
      data: visibleRows(rows(), rule, requireSession(opts)).find((r) => r.id === id) ?? null,
    }),
    create: async (input: Record<string, unknown>, opts?: AuthOpts): Promise<Result<Row>> => {
      const sub = requireSession(opts);
      const at = new Date().toISOString();
      const row: Row = {
        ...input,
        id: typeof input.id === 'string' ? input.id : nextId(model),
        owner: sub ?? undefined,
        createdAt: at,
        updatedAt: at,
      };
      rows().push(row);
      persist();
      emit(model, 'create', row);
      return { data: row };
    },
    update: async (
      input: Record<string, unknown> & { id: string },
      opts?: AuthOpts,
    ): Promise<Result<Row | null>> => {
      requireSession(opts);
      const idx = rows().findIndex((r) => r.id === input.id);
      if (idx === -1) return { data: null };
      const row: Row = { ...rows()[idx], ...input, updatedAt: new Date().toISOString() };
      rows()[idx] = row;
      persist();
      emit(model, 'update', row);
      return { data: row };
    },
    delete: async ({ id }: { id: string }, opts?: AuthOpts): Promise<Result<Row | null>> => {
      requireSession(opts);
      const row = rows().find((r) => r.id === id) ?? null;
      if (row) {
        loadDb().tables[model] = rows().filter((r) => r.id !== id);
        persist();
        emit(model, 'delete', row);
      }
      return { data: row };
    },
    onCreate: subscription(model, 'create'),
    onUpdate: subscription(model, 'update'),
    onDelete: subscription(model, 'delete'),
  };
}
