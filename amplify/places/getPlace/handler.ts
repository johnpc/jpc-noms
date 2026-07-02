/**
 * getGooglePlace query resolver. Cache-first by the place id (search already
 * caches each place under its id); on a miss, fetch details from Google, cache
 * them under the id, and return the shaped place. Thin — logic in placeShape +
 * the mocked cache/googleApi edges.
 */
import type { Schema } from '../../data/resource';
import { readCache, writeCache } from '../shared/cache';
import { placeDetail } from '../shared/googleApi';
import { toGooglePlace } from '../shared/placeShape';

type Place = ReturnType<typeof toGooglePlace>;

export const handler: Schema['getGooglePlace']['functionHandler'] = async (event) => {
  const placeId = event.arguments.placeId;

  const cached = await readCache(placeId);
  if (cached) return JSON.parse(cached) as Place;

  const raw = await placeDetail(placeId);
  const place = toGooglePlace(raw);
  await writeCache(placeId, JSON.stringify(place));
  return place;
};
