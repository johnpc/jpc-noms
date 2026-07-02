import { describe, it, expect } from 'vitest';
import { searchCacheKey, toGooglePlace } from './placeShape';

describe('searchCacheKey', () => {
  it('is stable across coordinate jitter within 3 decimals and query casing', () => {
    const a = searchCacheKey({
      latitude: 42.28082,
      longitude: -83.74303,
      openNow: false,
      search: 'Tacos',
    });
    const b = searchCacheKey({
      latitude: 42.28088,
      longitude: -83.74304,
      openNow: false,
      search: ' tacos ',
    });
    expect(a).toBe(b);
  });

  it('differs when openNow or query changes', () => {
    const base = { latitude: 42.28, longitude: -83.74, openNow: false, search: 'pizza' };
    expect(searchCacheKey(base)).not.toBe(searchCacheKey({ ...base, openNow: true }));
    expect(searchCacheKey(base)).not.toBe(searchCacheKey({ ...base, search: 'sushi' }));
  });
});

describe('toGooglePlace', () => {
  it('maps photos to names and preserves summaries', () => {
    const out = toGooglePlace({
      id: 'p1',
      name: 'places/p1',
      formattedAddress: '1 Main St',
      photos: [{ name: 'photos/a' }, { name: 'photos/b' }],
      displayName: { text: "Joe's Pizza", languageCode: 'en' },
      editorialSummary: { text: 'Cozy slice shop' },
    });
    expect(out.photos).toEqual(['photos/a', 'photos/b']);
    expect(out.displayName.text).toBe("Joe's Pizza");
    expect(out.formattedAddress).toBe('1 Main St');
    expect(out.editorialSummary?.text).toBe('Cozy slice shop');
  });

  it('falls back to id when name/displayName are missing', () => {
    const out = toGooglePlace({ id: 'p2' });
    expect(out.name).toBe('p2');
    expect(out.displayName.text).toBe('p2');
    expect(out.photos).toEqual([]);
  });
});
