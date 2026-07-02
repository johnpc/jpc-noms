import { describe, it, expect, vi, beforeEach } from 'vitest';

const e = vi.hoisted(() => ({
  readCache: vi.fn(),
  writeCache: vi.fn(),
  photoUri: vi.fn(),
}));
vi.mock('../shared/cache', () => ({ readCache: e.readCache, writeCache: e.writeCache }));
vi.mock('../shared/googleApi', () => ({ photoUri: e.photoUri }));

import { handler } from './handler';

type Image = { name: string; photoUri: string };
const call = handler as unknown as (e: { arguments: { photoId: string } }) => Promise<Image>;
const evt = (photoId: string) => ({ arguments: { photoId } });

describe('getGooglePlaceImage handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    e.writeCache.mockResolvedValue(undefined);
  });

  it('returns the cached image without calling Google', async () => {
    e.readCache.mockResolvedValue(JSON.stringify({ name: 'ph/1', photoUri: 'https://img/1' }));
    const out = await call(evt('ph/1'));
    expect(out).toEqual({ name: 'ph/1', photoUri: 'https://img/1' });
    expect(e.photoUri).not.toHaveBeenCalled();
  });

  it('on a miss, resolves + caches the uri', async () => {
    e.readCache.mockResolvedValue(null);
    e.photoUri.mockResolvedValue('https://img/new');
    const out = await call(evt('ph/2'));
    expect(out).toEqual({ name: 'ph/2', photoUri: 'https://img/new' });
    expect(e.writeCache).toHaveBeenCalledWith('image#ph/2', expect.any(String));
  });

  it('does not cache an empty uri (transient Google failure)', async () => {
    e.readCache.mockResolvedValue(null);
    e.photoUri.mockResolvedValue('');
    const out = await call(evt('ph/3'));
    expect(out.photoUri).toBe('');
    expect(e.writeCache).not.toHaveBeenCalled();
  });
});
