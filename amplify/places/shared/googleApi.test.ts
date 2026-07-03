import { describe, it, expect, vi, beforeEach } from 'vitest';

const send = vi.hoisted(() => vi.fn());
vi.mock('@aws-sdk/client-secrets-manager', () => ({
  SecretsManagerClient: vi.fn(() => ({ send })),
  GetSecretValueCommand: vi.fn((input) => ({ input })),
}));

import { searchText, placeDetail, photoUri } from './googleApi';

describe('googleApi edges', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.GOOGLE_SECRET_ARN = 'arn:secret:google';
    // The key is cached per module after the first fetch; provide it every time.
    send.mockResolvedValue({ SecretString: JSON.stringify({ GOOGLE_PLACES_API_KEY: 'test-key' }) });
  });

  it('searchText posts a text query with the secret key and returns places', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ json: async () => ({ places: [{ id: 'p1' }] }) } as Response);
    const out = await searchText({ latitude: 1, longitude: 2, openNow: true, search: 'tacos' });
    expect(out).toEqual([{ id: 'p1' }]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('places:searchText');
    expect((init as RequestInit).method).toBe('POST');
    expect((init as { headers: Record<string, string> }).headers['X-Goog-Api-Key']).toBe(
      'test-key',
    );
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
});
