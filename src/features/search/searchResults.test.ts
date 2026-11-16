import { describe, it, expect } from 'vitest';
import { searchResults } from './searchResults';
import type { Place } from './types';

const place: Place = { id: 'p1', name: 'places/p1', displayName: { text: 'Joe' } };
const q = { term: 'pizza', isPending: false, isError: false, data: [place] as Place[] | undefined };

describe('searchResults', () => {
  it('is idle without a term, whatever the query says', () => {
    expect(searchResults({ ...q, term: '  ', isPending: true })).toEqual({ kind: 'idle' });
  });
  it('is loading while the first page is pending (or data is absent)', () => {
    expect(searchResults({ ...q, isPending: true, data: undefined })).toEqual({ kind: 'loading' });
    expect(searchResults({ ...q, data: undefined })).toEqual({ kind: 'loading' });
  });
  it('reports a failed search as its own state, not an empty result', () => {
    expect(searchResults({ ...q, isError: true, data: undefined }).kind).toBe('error');
  });
  it('is empty vs ready from the data', () => {
    expect(searchResults({ ...q, data: [] })).toEqual({ kind: 'empty' });
    expect(searchResults(q)).toEqual({ kind: 'ready', places: [place] });
  });
});
