import { describe, it, expect, vi, beforeEach } from 'vitest';

const e = vi.hoisted(() => ({
  readCache: vi.fn(),
  writeCache: vi.fn(),
  placeDetail: vi.fn(),
}));
vi.mock('../shared/cache', () => ({ readCache: e.readCache, writeCache: e.writeCache }));
vi.mock('../shared/googleApi', () => ({ placeDetail: e.placeDetail }));

import { handler } from './handler';

type Place = { id: string; name: string };
const call = handler as unknown as (e: { arguments: { placeId: string } }) => Promise<Place>;
const evt = (placeId: string) => ({ arguments: { placeId } });

describe('getGooglePlace handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    e.writeCache.mockResolvedValue(undefined);
  });

  it('returns the cached place without calling Google', async () => {
    e.readCache.mockResolvedValue(JSON.stringify({ id: 'p1', name: 'Cached' }));
    const out = await call(evt('p1'));
    expect(out).toMatchObject({ id: 'p1', name: 'Cached' });
    expect(e.placeDetail).not.toHaveBeenCalled();
  });

  it('on a miss, fetches details, caches under the id, and returns the shaped place', async () => {
    e.readCache.mockResolvedValue(null);
    e.placeDetail.mockResolvedValue({ id: 'p9', displayName: { text: 'Nine' } });
    const out = await call(evt('p9'));
    expect(out).toMatchObject({ id: 'p9', name: 'p9' });
    expect(e.writeCache).toHaveBeenCalledWith('p9', expect.any(String));
  });
});
