import { describe, it, expect, vi, beforeEach } from 'vitest';

const e = vi.hoisted(() => ({ placeDetail: vi.fn(), writeCache: vi.fn() }));
vi.mock('./googleApi', () => ({ placeDetail: e.placeDetail }));
vi.mock('./cache', () => ({ writeCache: e.writeCache }));

import { placeIdFromPhotoId, refreshPlacePhotos } from './refreshPlacePhotos';

describe('placeIdFromPhotoId', () => {
  it('extracts the place id from a photo resource name', () => {
    expect(placeIdFromPhotoId('places/ChIJabc123/photos/AaVGc3xyz')).toBe('ChIJabc123');
  });

  it('returns null for anything else', () => {
    expect(placeIdFromPhotoId('not-a-photo-name')).toBeNull();
    expect(placeIdFromPhotoId('places/ChIJabc123')).toBeNull();
  });
});

describe('refreshPlacePhotos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('re-fetches the place, re-caches it, and returns the first current photo name', async () => {
    e.placeDetail.mockResolvedValue({
      id: 'ChIJabc',
      displayName: { text: 'Spot' },
      photos: [{ name: 'places/ChIJabc/photos/FRESH1' }, { name: 'places/ChIJabc/photos/FRESH2' }],
    });
    const fresh = await refreshPlacePhotos('places/ChIJabc/photos/DEAD');
    expect(fresh).toBe('places/ChIJabc/photos/FRESH1');
    expect(e.placeDetail).toHaveBeenCalledWith('ChIJabc');
    // The place cache row is REPLACED so future getGooglePlace reads serve
    // live photo names (the root of the rot, not just this one render).
    expect(e.writeCache).toHaveBeenCalledWith('ChIJabc', expect.stringContaining('FRESH1'));
  });

  it('returns null (no cache write) when the photoId is not a photo resource name', async () => {
    expect(await refreshPlacePhotos('garbage')).toBeNull();
    expect(e.placeDetail).not.toHaveBeenCalled();
  });

  it('returns null when the refreshed place has no photos', async () => {
    e.placeDetail.mockResolvedValue({ id: 'ChIJabc', photos: [] });
    expect(await refreshPlacePhotos('places/ChIJabc/photos/DEAD')).toBeNull();
  });

  it('returns null without caching when Google returns no usable place', async () => {
    e.placeDetail.mockResolvedValue({});
    expect(await refreshPlacePhotos('places/ChIJabc/photos/DEAD')).toBeNull();
    expect(e.writeCache).not.toHaveBeenCalled();
  });
});
