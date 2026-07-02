import { useState, useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import type { Coordinates } from './types';

// Ann Arbor — a sensible default so guests see results before granting (or
// while denying) location. Matches the seeded restaurants' city.
export const DEFAULT_COORDS: Coordinates = { latitude: 42.280827, longitude: -83.743034 };

const STORAGE_KEY = 'noms.coordinates';

function stored(): Coordinates {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Coordinates) : DEFAULT_COORDS;
}

/** Current device coordinates, falling back to DEFAULT_COORDS if unavailable.
 * Persists the last good fix so a returning guest starts where they were. */
export function useGeolocation(): Coordinates {
  const [coords, setCoords] = useState<Coordinates>(stored);

  useEffect(() => {
    Geolocation.getCurrentPosition({ enableHighAccuracy: true, maximumAge: 300000, timeout: 5000 })
      .then((pos) => {
        const next = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setCoords(next);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      })
      .catch(() => {
        // Denied/unavailable — keep the last stored fix (or the default).
      });
  }, []);

  return coords;
}
