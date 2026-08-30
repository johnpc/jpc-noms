/**
 * getGooglePlaceImage query resolver. Resolves a Places photo resource name to
 * a hosted image URI on every call — NOT cached. Google's photo-media endpoint
 * (with skipHttpRedirect) returns a short-lived signed lh3.googleusercontent.com
 * URL that expires; persisting it means the app eventually serves dead (403)
 * links. The photo resource name (`photoId`) is the stable identifier and is
 * already cached with the place, so re-resolving here is cheap and always live.
 * Thin — the network call lives in the mocked googleApi edge.
 */
import type { Schema } from '../../data/resource';
import { photoUri } from '../shared/googleApi';

type Image = { name: string; photoUri: string };

export const handler: Schema['getGooglePlaceImage']['functionHandler'] = async (event) => {
  const photoId = event.arguments.photoId;
  const widthPx = event.arguments.widthPx ?? undefined;
  const heightPx = event.arguments.heightPx ?? undefined;

  const uri = await photoUri(photoId, widthPx, heightPx);
  const result: Image = { name: photoId, photoUri: uri };
  return result;
};
