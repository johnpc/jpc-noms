/**
 * searchGooglePlaces query resolver. Cache-first: hit the GoogleApiCache by a
 * stable key; on a miss, call Google, cache the search result AND each place by
 * its id (so getGooglePlace + the Tesla-nav lookup can resolve a place without
 * another API call), then return the shaped places. Thin — logic lives in the
 * pure placeShape helpers and the mocked cache/googleApi edges.
 */
import type { Schema } from '../../data/resource';
import { readCache, writeCache } from '../shared/cache';
import { searchText } from '../shared/googleApi';
import { searchCacheKey, toGooglePlace, type RawPlace } from '../shared/placeShape';

type Result = ReturnType<typeof toGooglePlace>[];

export const handler: Schema['searchGooglePlaces']['functionHandler'] = async (event) => {
  const input = {
    latitude: event.arguments.latitude,
    longitude: event.arguments.longitude,
    openNow: !!event.arguments.openNow,
    search: event.arguments.search ?? '',
  };
  const cacheKey = searchCacheKey(input);

  const cached = await readCache(cacheKey);
  if (cached) return JSON.parse(cached) as Result;

  const raw: RawPlace[] = await searchText(input);
  const places = raw.map(toGooglePlace);

  // Never cache an empty result: a transient Google hiccup would otherwise
  // pin "no results" forever for a query that really does have places
  // (this was the "potbelly → nothing" bug). Only cache real hits.
  if (places.length > 0) {
    await writeCache(cacheKey, JSON.stringify(places), JSON.stringify(input));
    await Promise.all(raw.map((p, i) => writeCache(p.id, JSON.stringify(places[i]))));
  }

  return places;
};
