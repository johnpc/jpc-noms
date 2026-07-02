/**
 * getGooglePlaceImage query resolver. Resolves a Places photo resource name to
 * a hosted image URI, cached by the photo id so we don't re-hit Google for the
 * same photo. Thin — the network call lives in the mocked googleApi edge.
 */
import type { Schema } from '../../data/resource';
import { readCache, writeCache } from '../shared/cache';
import { photoUri } from '../shared/googleApi';

type Image = { name: string; photoUri: string };

export const handler: Schema['getGooglePlaceImage']['functionHandler'] = async (event) => {
  const photoId = event.arguments.photoId;
  const widthPx = event.arguments.widthPx ?? undefined;
  const heightPx = event.arguments.heightPx ?? undefined;

  const cached = await readCache(`image#${photoId}`);
  if (cached) return JSON.parse(cached) as Image;

  const uri = await photoUri(photoId, widthPx, heightPx);
  const result: Image = { name: photoId, photoUri: uri };
  if (uri) await writeCache(`image#${photoId}`, JSON.stringify(result));
  return result;
};
