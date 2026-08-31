/**
 * Durable photo-byte store: S3 behind CloudFront. Google's photo-media URLs
 * are short-lived signed links AND every resolution is a paid Places call, so
 * we fetch each photo's bytes ONCE, keep them in a private bucket (CloudFront
 * OAC is the only reader), and serve a permanent CDN URL. Keys are sha256 of
 * the photo resource name — server-derived, never a user-controlled path.
 * Bucket/domain are injected by backend.ts; mocked in handler tests.
 */
import { createHash } from 'node:crypto';
import { S3Client, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({});

/** Bucket + CDN domain, or null when the photo store isn't wired (the handler
 * then falls back to returning Google's short-lived signed URL). */
export function photoStoreConfig(): { bucket: string; domain: string } | null {
  const bucket = process.env.PHOTO_BUCKET_NAME;
  const domain = process.env.PHOTO_CDN_DOMAIN;
  return bucket && domain ? { bucket, domain } : null;
}

/** Deterministic object key for a photo at a size (photoId is hashed — it
 * contains slashes and can exceed key-safe lengths). */
export function photoKey(photoId: string, widthPx: number, heightPx: number): string {
  const hash = createHash('sha256').update(photoId).digest('hex');
  return `photos/${hash}-${widthPx}x${heightPx}`;
}

/** The permanent public URL CloudFront serves `key` under. */
export function photoCdnUrl(domain: string, key: string): string {
  return `https://${domain}/${key}`;
}

/** Whether `key` already exists in the bucket. */
export async function hasPhoto(bucket: string, key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

/** Store photo bytes under `key` (long-cached — the bytes never change). */
export async function storePhoto(
  bucket: string,
  key: string,
  bytes: Uint8Array,
  contentType: string,
): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: bytes,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
}

/** Download the actual image bytes from Google's signed URL. Null on failure
 * (the caller falls back to handing out the signed URL itself). */
export async function fetchImageBytes(
  url: string,
): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  const bytes = new Uint8Array(await res.arrayBuffer());
  return { bytes, contentType: res.headers.get('content-type') ?? 'image/jpeg' };
}
