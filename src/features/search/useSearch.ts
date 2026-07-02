import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useGeolocation } from './useGeolocation';
import { useSearchPlaces } from './searchApi';
import { useAuth } from '../auth/useAuth';
import { useAddToRotation, useRotation } from '../rotation/rotationApi';

/**
 * Search-page logic: debounce-free term state, geolocated search, and an
 * auth-gated "add to rotation" (guests are routed to sign-in before saving).
 * Components render from this; no logic lives in the JSX.
 */
export function useSearch() {
  const coords = useGeolocation();
  const { status } = useAuth();
  const history = useHistory();
  const [term, setTerm] = useState('');

  const search = useSearchPlaces(coords, term);
  const rotation = useRotation(status === 'authenticated');
  const addToRotation = useAddToRotation();

  const savedIds = new Set((rotation.data ?? []).map((r) => r.googlePlaceId));

  const add = (googlePlaceId: string) => {
    if (status !== 'authenticated') {
      history.push('/signin');
      return;
    }
    addToRotation.mutate(googlePlaceId);
  };

  return {
    term,
    setTerm,
    places: search.data ?? [],
    isLoading: search.isFetching && term.trim().length > 0,
    savedIds,
    add,
    adding: addToRotation.isPending,
  };
}
