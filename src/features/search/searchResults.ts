/** Pure derivation of the search page's results area — no I/O, unit-tested. */
import type { Place } from './types';

// @state-machine search-results

/**
 * What the results area shows. One union instead of `isLoading` + `places` +
 * `term` read three different ways in the JSX — which hid a real gap: a FAILED
 * search rendered as "No restaurants found", indistinguishable from an honest
 * empty result. `error` is now its own state with its own copy + retry.
 */
export type SearchResults =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'empty' }
  | { kind: 'ready'; places: Place[] };

export interface SearchQueryState {
  term: string;
  isPending: boolean;
  isError: boolean;
  data: Place[] | undefined;
}

export function searchResults(q: SearchQueryState): SearchResults {
  if (q.term.trim().length === 0) return { kind: 'idle' };
  if (q.isError) return { kind: 'error', message: "Couldn't load restaurants." };
  if (q.isPending || !q.data) return { kind: 'loading' };
  return q.data.length === 0 ? { kind: 'empty' } : { kind: 'ready', places: q.data };
}
