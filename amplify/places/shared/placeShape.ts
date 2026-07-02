/**
 * Pure shaping helpers for Google Places responses — no I/O, fully unit-tested.
 * Keeps the cache key stable and trims the raw Google payload down to the
 * GooglePlace fields the schema returns.
 */
import crypto from 'node:crypto';

export interface RawPlace {
  id: string;
  name?: string;
  websiteUri?: string;
  formattedAddress?: string;
  priceLevel?: string;
  photos?: { name: string }[];
  displayName?: { text?: string; languageCode?: string };
  primaryTypeDisplayName?: { text?: string; languageCode?: string };
  generativeSummary?: { text?: string; languageCode?: string };
  editorialSummary?: { text?: string; languageCode?: string };
}

/** Stable cache key for a search: rounded coords + normalized query + flags. */
export function searchCacheKey(input: {
  latitude: number;
  longitude: number;
  openNow: boolean;
  search: string;
}): string {
  const canonical = JSON.stringify({
    latitude: input.latitude.toFixed(3),
    longitude: input.longitude.toFixed(3),
    openNow: input.openNow,
    search: input.search.trim().toLowerCase(),
  });
  return crypto.createHash('md5').update(canonical).digest('hex');
}

/** Trim a raw Google place to the GooglePlace shape the schema returns. */
export function toGooglePlace(raw: RawPlace) {
  return {
    id: raw.id,
    name: raw.name ?? raw.id,
    photos: (raw.photos ?? []).map((p) => p.name),
    websiteUri: raw.websiteUri,
    formattedAddress: raw.formattedAddress,
    priceLevel: raw.priceLevel,
    displayName: raw.displayName ?? { text: raw.name ?? raw.id },
    primaryTypeDisplayName: raw.primaryTypeDisplayName,
    generativeSummary: raw.generativeSummary,
    editorialSummary: raw.editorialSummary,
  };
}
