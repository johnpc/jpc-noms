import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchText, placeDetail, photoUri } from './googleApi';

describe('googleApi edges', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.GOOGLE_PLACES_API_KEY = 'test-key';
  });

  it('searchText posts a text query and returns places', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ json: async () => ({ places: [{ id: 'p1' }] }) } as Response);
    const out = await searchText({ latitude: 1, longitude: 2, openNow: true, search: 'tacos' });
    expect(out).toEqual([{ id: 'p1' }]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('places:searchText');
    expect((init as RequestInit).method).toBe('POST');
  });

  it('searchText returns [] when Google omits places', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ json: async () => ({}) } as Response);
    expect(await searchText({ latitude: 1, longitude: 2, openNow: false, search: '' })).toEqual([]);
  });

  it('placeDetail fetches details by id', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: async () => ({ id: 'p9' }),
    } as Response);
    expect(await placeDetail('places/p9')).toEqual({ id: 'p9' });
  });

  it('photoUri resolves a hosted uri, or "" when absent', async () => {
    const f = vi.spyOn(globalThis, 'fetch');
    f.mockResolvedValueOnce({ json: async () => ({ photoUri: 'https://img/1' }) } as Response);
    expect(await photoUri('ph/1')).toBe('https://img/1');
    f.mockResolvedValueOnce({ json: async () => ({}) } as Response);
    expect(await photoUri('ph/2')).toBe('');
  });

  it('throws when the API key is unset', async () => {
    delete process.env.GOOGLE_PLACES_API_KEY;
    await expect(placeDetail('p')).rejects.toThrow('GOOGLE_PLACES_API_KEY not set');
  });
});
