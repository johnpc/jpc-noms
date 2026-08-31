import { describe, it, expect, vi, beforeEach } from 'vitest';

const e = vi.hoisted(() => ({
  photoUri: vi.fn(),
  hasPhoto: vi.fn(),
  storePhoto: vi.fn(),
  fetchImageBytes: vi.fn(),
  config: vi.fn(),
}));
vi.mock('../shared/googleApi', () => ({ photoUri: e.photoUri }));
vi.mock('../shared/photoStore', () => ({
  photoStoreConfig: e.config,
  photoKey: (id: string, w: number, h: number) => `photos/key-${id}-${w}x${h}`,
  photoCdnUrl: (domain: string, key: string) => `https://${domain}/${key}`,
  hasPhoto: e.hasPhoto,
  storePhoto: e.storePhoto,
  fetchImageBytes: e.fetchImageBytes,
}));

import { handler } from './handler';

type Image = { name: string; photoUri: string };
const call = handler as unknown as (e: {
  arguments: { photoId: string; widthPx?: number; heightPx?: number };
}) => Promise<Image>;
const evt = (photoId: string, widthPx?: number, heightPx?: number) => ({
  arguments: { photoId, widthPx, heightPx },
});

describe('getGooglePlaceImage handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    e.config.mockReturnValue({ bucket: 'b', domain: 'cdn.example' });
  });

  it('serves the permanent CDN url without touching Google when bytes are stored', async () => {
    e.hasPhoto.mockResolvedValue(true);
    const out = await call(evt('ph', 800, 500));
    expect(out).toEqual({ name: 'ph', photoUri: 'https://cdn.example/photos/key-ph-800x500' });
    expect(e.photoUri).not.toHaveBeenCalled();
  });

  it('on a cold photo: resolves Google, stores the bytes, returns the CDN url', async () => {
    e.hasPhoto.mockResolvedValue(false);
    e.photoUri.mockResolvedValue('https://signed');
    e.fetchImageBytes.mockResolvedValue({ bytes: new Uint8Array([1]), contentType: 'image/jpeg' });
    const out = await call(evt('ph', 800, 500));
    expect(e.storePhoto).toHaveBeenCalledWith(
      'b',
      'photos/key-ph-800x500',
      expect.any(Uint8Array),
      'image/jpeg',
    );
    expect(out.photoUri).toBe('https://cdn.example/photos/key-ph-800x500');
  });

  it('defaults dimensions to 400x400 so one photo maps to one stored object', async () => {
    e.hasPhoto.mockResolvedValue(true);
    const out = await call(evt('ph'));
    expect(out.photoUri).toBe('https://cdn.example/photos/key-ph-400x400');
  });

  it('falls back to the signed url when the byte download fails', async () => {
    e.hasPhoto.mockResolvedValue(false);
    e.photoUri.mockResolvedValue('https://signed');
    e.fetchImageBytes.mockResolvedValue(null);
    const out = await call(evt('ph'));
    expect(out.photoUri).toBe('https://signed');
    expect(e.storePhoto).not.toHaveBeenCalled();
  });

  it('returns an empty uri on a transient Google failure', async () => {
    e.hasPhoto.mockResolvedValue(false);
    e.photoUri.mockResolvedValue('');
    const out = await call(evt('ph'));
    expect(out.photoUri).toBe('');
    expect(e.fetchImageBytes).not.toHaveBeenCalled();
  });

  it('resolves Google directly when the photo store is not wired', async () => {
    e.config.mockReturnValue(null);
    e.photoUri.mockResolvedValue('https://signed');
    const out = await call(evt('ph', 800, 500));
    expect(out).toEqual({ name: 'ph', photoUri: 'https://signed' });
    expect(e.hasPhoto).not.toHaveBeenCalled();
  });
});
