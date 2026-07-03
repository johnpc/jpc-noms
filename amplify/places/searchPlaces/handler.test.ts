import { describe, it, expect, vi, beforeEach } from 'vitest';

const e = vi.hoisted(() => ({
  readCache: vi.fn(),
  writeCache: vi.fn(),
  searchText: vi.fn(),
}));
vi.mock('../shared/cache', () => ({ readCache: e.readCache, writeCache: e.writeCache }));
vi.mock('../shared/googleApi', () => ({ searchText: e.searchText }));

import { handler } from './handler';

type Place = { id: string; name: string; photos: string[] };
// The resolver only reads event.arguments; the full AppSync handler signature
// (context/callback) is irrelevant here, so invoke it as a single-arg fn.
const call = handler as unknown as (e: {
  arguments: { latitude: number; longitude: number; search: string };
}) => Promise<Place[]>;
const evt = (search: string) => ({ arguments: { latitude: 42.28, longitude: -83.74, search } });

describe('searchGooglePlaces handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    e.writeCache.mockResolvedValue(undefined);
  });

  it('returns the cached result without calling Google', async () => {
    e.readCache.mockResolvedValue(JSON.stringify([{ id: 'p1', name: 'Cached' }]));
    const out = await call(evt('tacos'));
    expect(out).toEqual([{ id: 'p1', name: 'Cached' }]);
    expect(e.searchText).not.toHaveBeenCalled();
  });

  it('on a miss, fetches, caches the search + each place by id, and returns shaped places', async () => {
    e.readCache.mockResolvedValue(null);
    e.searchText.mockResolvedValue([
      { id: 'p1', displayName: { text: 'Joe' }, photos: [{ name: 'ph/1' }] },
      { id: 'p2', displayName: { text: 'Ann' } },
    ]);
    const out = await call(evt('pizza'));
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ id: 'p1', photos: ['ph/1'] });
    // 1 search-key write + 1 per place
    expect(e.writeCache).toHaveBeenCalledTimes(3);
    expect(e.writeCache).toHaveBeenCalledWith('p1', expect.any(String));
    expect(e.writeCache).toHaveBeenCalledWith('p2', expect.any(String));
  });

  it('does NOT cache an empty result (guards the transient-miss bug)', async () => {
    e.readCache.mockResolvedValue(null);
    e.searchText.mockResolvedValue([]);
    const out = await call(evt('potbelly'));
    expect(out).toEqual([]);
    expect(e.writeCache).not.toHaveBeenCalled();
  });
});
