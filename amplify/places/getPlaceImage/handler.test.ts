import { describe, it, expect, vi, beforeEach } from 'vitest';

const e = vi.hoisted(() => ({
  photoUri: vi.fn(),
}));
vi.mock('../shared/googleApi', () => ({ photoUri: e.photoUri }));

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
  });

  it('resolves a fresh uri on every call (no cache)', async () => {
    e.photoUri.mockResolvedValue('https://img/new');
    const out = await call(evt('ph/2'));
    expect(out).toEqual({ name: 'ph/2', photoUri: 'https://img/new' });
    expect(e.photoUri).toHaveBeenCalledWith('ph/2', undefined, undefined);
  });

  it('passes through the requested dimensions', async () => {
    e.photoUri.mockResolvedValue('https://img/sized');
    await call(evt('ph/3', 800, 500));
    expect(e.photoUri).toHaveBeenCalledWith('ph/3', 800, 500);
  });

  it('returns an empty uri on a transient Google failure', async () => {
    e.photoUri.mockResolvedValue('');
    const out = await call(evt('ph/4'));
    expect(out.photoUri).toBe('');
  });
});
