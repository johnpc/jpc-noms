import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const send = vi.hoisted(() => vi.fn());
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(() => ({ send })),
  HeadObjectCommand: vi.fn((input) => ({ kind: 'head', input })),
  PutObjectCommand: vi.fn((input) => ({ kind: 'put', input })),
}));

import {
  photoStoreConfig,
  photoKey,
  photoCdnUrl,
  hasPhoto,
  storePhoto,
  fetchImageBytes,
} from './photoStore';

describe('photoStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PHOTO_BUCKET_NAME = 'bucket';
    process.env.PHOTO_CDN_DOMAIN = 'dxxx.cloudfront.net';
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads config from the environment, null when unwired', () => {
    expect(photoStoreConfig()).toEqual({ bucket: 'bucket', domain: 'dxxx.cloudfront.net' });
    delete process.env.PHOTO_CDN_DOMAIN;
    expect(photoStoreConfig()).toBeNull();
  });

  it('derives a deterministic, slash-free key from the photo resource name', () => {
    const key = photoKey('places/abc/photos/def', 800, 500);
    expect(key).toBe(photoKey('places/abc/photos/def', 800, 500));
    expect(key).toMatch(/^photos\/[0-9a-f]{64}-800x500$/);
    expect(photoKey('places/abc/photos/def', 400, 400)).not.toBe(key);
  });

  it('builds the CDN url', () => {
    expect(photoCdnUrl('d.cloudfront.net', 'photos/k')).toBe('https://d.cloudfront.net/photos/k');
  });

  it('hasPhoto: true on a successful head, false when S3 throws (missing)', async () => {
    send.mockResolvedValueOnce({});
    expect(await hasPhoto('bucket', 'k')).toBe(true);
    send.mockRejectedValueOnce(new Error('NotFound'));
    expect(await hasPhoto('bucket', 'k')).toBe(false);
  });

  it('storePhoto puts immutable-cached bytes with the content type', async () => {
    send.mockResolvedValue({});
    await storePhoto('bucket', 'k', new Uint8Array([1]), 'image/png');
    const input = send.mock.calls[0][0].input;
    expect(input).toMatchObject({ Bucket: 'bucket', Key: 'k', ContentType: 'image/png' });
    expect(input.CacheControl).toContain('immutable');
  });

  it('fetchImageBytes returns bytes + content type, null on a failed response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new Uint8Array([7]).buffer),
        headers: { get: () => 'image/jpeg' },
      }),
    );
    const out = await fetchImageBytes('https://img');
    expect(out?.contentType).toBe('image/jpeg');
    expect(Array.from(out?.bytes ?? [])).toEqual([7]);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    expect(await fetchImageBytes('https://img')).toBeNull();
  });
});
