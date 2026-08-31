/**
 * Self-heal for expired photo resource names. Google rotates the photo names
 * inside a place ("AaVGc3…" → "AVoNoX…"): a name cached with a place months
 * ago starts answering 400 INVALID_ARGUMENT, and since the place cache never
 * expires, every photo render breaks forever. When that happens we re-fetch
 * the place's details (the photo name embeds the place id), re-cache the
 * place so future clients get live names, and hand back a fresh photo name
 * to retry with. Network/cache edges are the mocked shared modules.
 */
import { writeCache } from './cache';
import { placeDetail } from './googleApi';
import { toGooglePlace } from './placeShape';

/** 'places/<placeId>/photos/<ref>' → '<placeId>' (null if not that shape). */
export function placeIdFromPhotoId(photoId: string): string | null {
  const m = /^places\/([^/]+)\/photos\//.exec(photoId);
  return m ? m[1] : null;
}

/**
 * Refresh the cached place behind a dead photoId. Returns the place's first
 * CURRENT photo name (what the UI renders), or null when the photoId doesn't
 * parse or the place has no photos anymore.
 */
export async function refreshPlacePhotos(photoId: string): Promise<string | null> {
  const placeId = placeIdFromPhotoId(photoId);
  if (!placeId) return null;
  const place = toGooglePlace(await placeDetail(placeId));
  if (!place.id) return null;
  await writeCache(placeId, JSON.stringify(place));
  return place.photos[0] ?? null;
}
