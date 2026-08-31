/**
 * Fetch strategy for the ['noms'] query. The FIRST load of a session pages the
 * full history (Stats + previous-pick need every nom); every refetch after
 * that — the 8s poll, focus, resume — asks only for the most recently TOUCHED
 * noms via the pairingId+updatedAt GSI and merges them into the cached list,
 * so steady-state polling is one small query, not O(history) pages.
 */
import { dataClient } from '../../lib/dataClient';
import { nomFromRecord, upsertNom } from './nomRecord';
import { AUTH } from './nomWrite';
import type { Nom } from './types';

/** How many recently-updated noms one poll pulls — plenty for a household of
 * two to reconcile anything a dropped subscription missed. */
export const RECENT_LIMIT = 50;

// WHO the full history has been paged for this JS session (Cognito sub) —
// keyed by user so switching accounts re-loads instead of merging into the
// previous account's cache. Deliberately NOT "is the cache non-empty": a
// subscription event can land in the cache before the first fetch settles,
// and that must not demote the initial load to a recent-only query (Stats
// would silently lose most of its history).
let historyLoadedFor: string | null = null;

/** Test-only: forget that history was loaded. */
export function resetNomsFetch(): void {
  historyLoadedFor = null;
}

/** Full load (replacing the cache) on a user's first call of the session,
 * cheap recent-merge after. Also re-pages when the cached list is empty —
 * react-query can garbage-collect an unobserved cache entry, and merging
 * "recent" over nothing would silently lose the history. */
export async function fetchNoms(
  prev: Nom[] | undefined,
  pairingId: string,
  sub: string,
): Promise<Nom[]> {
  if (historyLoadedFor === sub && prev && prev.length > 0) {
    return fetchRecentNoms(prev, pairingId);
  }
  const all = await fetchAllNoms();
  historyLoadedFor = sub;
  return all;
}

/** Page through ALL noms — the default list caps at 100, which silently hid
 * most of the migrated history (259+ rows) from Stats + the previous-pick. */
async function fetchAllNoms(): Promise<Nom[]> {
  const rows: Record<string, unknown>[] = [];
  let nextToken: string | undefined;
  do {
    const { data, nextToken: nt } = await dataClient.models.Nom.list({ ...AUTH, nextToken });
    rows.push(...((data ?? []) as Record<string, unknown>[]));
    nextToken = nt ?? undefined;
  } while (nextToken);
  return rows.map(nomFromRecord);
}

/**
 * The RECENT_LIMIT most recently updated noms of `pairingId` (via the GSI),
 * merged OVER `prev` — never replacing it, so rows outside this pairing
 * partition (pre-pairing history) and optimistic writes are kept. A delete
 * missed while backgrounded lingers until the next full load; the onDelete
 * subscription covers the live case.
 */
async function fetchRecentNoms(prev: Nom[], pairingId: string): Promise<Nom[]> {
  const { data } = await dataClient.models.Nom.listNomByPairingIdAndUpdatedAt(
    { pairingId },
    { ...AUTH, sortDirection: 'DESC', limit: RECENT_LIMIT },
  );
  return ((data ?? []) as Record<string, unknown>[]).reduce(
    (list, row) => upsertNom(list, nomFromRecord(row)),
    prev,
  );
}
