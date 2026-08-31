/**
 * getGooglePlaceImage query resolver. Serves each photo from OUR CDN: on a
 * cold photo it resolves Google's short-lived signed URL, downloads the bytes
 * ONCE into S3, and returns the permanent CloudFront URL — so Google's paid
 * photo-media endpoint is hit once per photo+size ever, not per client per
 * hour. Google also ROTATES photo resource names: a name cached with a place
 * long ago starts answering 400, so on a dead name we refresh the place's
 * details (self-heal, see refreshPlacePhotos), retry with the current name,
 * and store the bytes under the REQUESTED key — every stale reference to that
 * photo heals once, then serves from S3 forever. If the store isn't wired,
 * falls back to the signed URL. Network edges live in mocked modules.
 */
import type { Schema } from '../../data/resource';
import { photoUri } from '../shared/googleApi';
import { refreshPlacePhotos } from '../shared/refreshPlacePhotos';
import {
  photoStoreConfig,
  photoKey,
  photoCdnUrl,
  hasPhoto,
  storePhoto,
  fetchImageBytes,
} from '../shared/photoStore';

/** Google's signed URL for photoId, healing a rotated (dead) name once. */
async function resolveSignedUrl(photoId: string, w: number, h: number): Promise<string> {
  const direct = await photoUri(photoId, w, h);
  if (direct) return direct;
  const fresh = await refreshPlacePhotos(photoId).catch(() => null);
  return fresh ? photoUri(fresh, w, h) : '';
}

export const handler: Schema['getGooglePlaceImage']['functionHandler'] = async (event) => {
  const photoId = event.arguments.photoId;
  const widthPx = event.arguments.widthPx ?? 400;
  const heightPx = event.arguments.heightPx ?? 400;

  const store = photoStoreConfig();
  if (!store) {
    return { name: photoId, photoUri: await resolveSignedUrl(photoId, widthPx, heightPx) };
  }

  const key = photoKey(photoId, widthPx, heightPx);
  const cdnUrl = photoCdnUrl(store.domain, key);
  if (await hasPhoto(store.bucket, key)) return { name: photoId, photoUri: cdnUrl };

  const signedUrl = await resolveSignedUrl(photoId, widthPx, heightPx);
  if (!signedUrl) return { name: photoId, photoUri: '' };

  const image = await fetchImageBytes(signedUrl);
  if (!image) return { name: photoId, photoUri: signedUrl };

  await storePhoto(store.bucket, key, image.bytes, image.contentType);
  return { name: photoId, photoUri: cdnUrl };
};
