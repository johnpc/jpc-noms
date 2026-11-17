/**
 * The fake backend's storage: one JSON document of tables in localStorage, so
 * a sign-in or a nom survives a full page navigation exactly like the real
 * cloud does, plus an in-memory change bus that stands in for AppSync
 * subscriptions. Zero network. Seeded on first load from ./seed.
 */
import { seedDb } from './seed';

export type Row = Record<string, unknown> & { id: string };
export interface Db {
  tables: Record<string, Row[]>;
}

export const DB_KEY = 'noms.fake.db';
let cache: Db | null = null;

export function loadDb(): Db {
  if (cache) return cache;
  const raw = localStorage.getItem(DB_KEY);
  cache = raw ? (JSON.parse(raw) as Db) : seedDb();
  if (!raw) localStorage.setItem(DB_KEY, JSON.stringify(cache));
  return cache;
}

export function saveDb(db: Db): void {
  cache = db;
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

/** Forget everything (tests + the demo's "start over"). */
export function resetDb(): void {
  cache = null;
  localStorage.removeItem(DB_KEY);
}

export function table(name: string): Row[] {
  const db = loadDb();
  return (db.tables[name] ??= []);
}

export type ChangeKind = 'create' | 'update' | 'delete';
type Listener = (row: Row) => void;
const listeners = new Map<string, Set<Listener>>();
const key = (model: string, kind: ChangeKind) => `${model}:${kind}`;

export function onChange(model: string, kind: ChangeKind, fn: Listener): () => void {
  const set = listeners.get(key(model, kind)) ?? new Set<Listener>();
  set.add(fn);
  listeners.set(key(model, kind), set);
  return () => set.delete(fn);
}

export function emit(model: string, kind: ChangeKind, row: Row): void {
  listeners.get(key(model, kind))?.forEach((fn) => fn(row));
}

let counter = 0;
/** Ids are readable + unique within a session; a reload keeps uniqueness via Date.now(). */
export function nextId(model: string): string {
  counter += 1;
  return `fake-${model.toLowerCase()}-${Date.now().toString(36)}-${counter}`;
}
