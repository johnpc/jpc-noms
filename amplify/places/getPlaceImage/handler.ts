/**
 * getGooglePlaceImage query resolver. Serves each photo from OUR CDN: on a
 * cold photo it resolves Google's short-lived signed URL, downloads the bytes
 * ONCE into S3, and returns the permanent CloudFront URL — so Google's paid
 * photo-media endpoint is hit once per photo+size ever, not per client per
 * hour, and the URL we hand out never expires (the old approaches either
 * cached an expiring URL → dead 403 links, or re-resolved per request → cost).
 * If the store isn't wired or the byte-fetch fails, falls back to the signed
 * URL — correct, just not permanent. Network edges live in mocked modules.
 */
import type { Schema } from '../../data/resource';
import { photoUri } from '../shared/googleApi';
import {
  photoStoreConfig,
  photoKey,
  photoCdnUrl,
  hasPhoto,
  storePhoto,
  fetchImageBytes,
} from '../shared/photoStore';

type Image = { name: string; photoUri: string };

export const handler: Schema['getGooglePlaceImage']['functionHandler'] = async (event) => {
  const photoId = event.arguments.photoId;
  const widthPx = event.arguments.widthPx ?? 400;
  const heightPx = event.arguments.heightPx ?? 400;

  const store = photoStoreConfig();
  if (!store) return { name: photoId, photoUri: await photoUri(photoId, widthPx, heightPx) };

  const key = photoKey(photoId, widthPx, heightPx);
  const cdnUrl = photoCdnUrl(store.domain, key);
  if (await hasPhoto(store.bucket, key)) return { name: photoId, photoUri: cdnUrl };

  const signedUrl = await photoUri(photoId, widthPx, heightPx);
  if (!signedUrl) return { name: photoId, photoUri: '' };

  const image = await fetchImageBytes(signedUrl);
  if (!image) return { name: photoId, photoUri: signedUrl };

  await storePhoto(store.bucket, key, image.bytes, image.contentType);
  const result: Image = { name: photoId, photoUri: cdnUrl };
  return result;
};
