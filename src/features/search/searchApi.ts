/**
 * Server state for restaurant search + place details (react-query wrapping the
 * Amplify client). Guest-browsable: reads use the client's default auth mode
 * (identityPool for guests, userPool once signed in — see dataClient).
 */
import { useQuery } from '@tanstack/react-query';
import { dataClient, readAuthMode } from '../../lib/dataClient';
import type { Coordinates, Place } from './types';

// Reads go through readAuthMode(): a signed-in user calls via userPool, a guest
// via identityPool. A mismatch (e.g. calling identityPool while signed into
// userPool without a live guest identity) returns 401/empty — stoop ADR 0004.

/** Search restaurants near `coords` for `term`. Disabled until a term is typed. */
export function useSearchPlaces(coords: Coordinates, term: string) {
  return useQuery({
    queryKey: ['places', coords.latitude, coords.longitude, term],
    queryFn: async (): Promise<Place[]> => {
      const authMode = await readAuthMode();
      const { data } = await dataClient.queries.searchGooglePlaces(
        { latitude: coords.latitude, longitude: coords.longitude, search: term },
        { authMode },
      );
      return (data ?? []).filter((p): p is Place => !!p);
    },
    enabled: term.trim().length > 0,
    staleTime: 1000 * 60 * 5,
  });
}

/** Fetch one place's details by id (used by rotation + nom cards). */
export function usePlace(placeId: string | undefined) {
  return useQuery({
    queryKey: ['place', placeId],
    queryFn: async (): Promise<Place | null> => {
      const authMode = await readAuthMode();
      const { data } = await dataClient.queries.getGooglePlace(
        { placeId: placeId as string },
        { authMode },
      );
      return (data as Place) ?? null;
    },
    enabled: !!placeId,
    staleTime: 1000 * 60 * 60,
  });
}
