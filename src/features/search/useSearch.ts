import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useGeolocation } from './useGeolocation';
import { useSearchPlaces } from './searchApi';
import { useAuth } from '../auth/useAuth';
import { useAddToRotation, useRotation } from '../rotation/rotationApi';
import { useAddToNom } from '../noms/useAddToNom';
import { DEFAULT_QUERY, SEARCH_SUGGESTIONS } from './suggestions';

/**
 * Search-page logic: debounce-free term state, geolocated search, an auth-gated
 * "add to rotation", and a one-tap "➕ Nom" that drops a place into today's open
 * nom. Guests are routed to sign-in before either write. No logic in the JSX.
 */
export function useSearch() {
  const coords = useGeolocation();
  const { status } = useAuth();
  const history = useHistory();
  // Default to a "food" search near the user so the page isn't empty on load.
  const [term, setTerm] = useState(DEFAULT_QUERY);
  const signedIn = status === 'authenticated';

  const search = useSearchPlaces(coords, term);
  const rotation = useRotation(signedIn);
  const addToRotation = useAddToRotation();
  const nom = useAddToNom();

  const savedIds = new Set((rotation.data ?? []).map((r) => r.googlePlaceId));

  const add = (googlePlaceId: string) => {
    if (!signedIn) return void history.push('/signin');
    addToRotation.mutate(googlePlaceId);
  };

  const addNom = (googlePlaceId: string) => {
    if (!signedIn) return void history.push('/signin');
    void nom.addToNom(googlePlaceId);
  };

  return {
    term,
    setTerm,
    suggestions: SEARCH_SUGGESTIONS,
    places: search.data ?? [],
    isLoading: search.isFetching && term.trim().length > 0,
    savedIds,
    add,
    adding: addToRotation.isPending,
    addNom,
    addingNom: nom.busy,
  };
}
