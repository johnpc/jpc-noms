/** Pure display helpers for a Place — no I/O, unit-tested. */
import type { Place, PlaceText } from './types';

const PRICE_LABELS: Record<string, string> = {
  PRICE_LEVEL_INEXPENSIVE: '$',
  PRICE_LEVEL_MODERATE: '$$',
  PRICE_LEVEL_EXPENSIVE: '$$$',
  PRICE_LEVEL_VERY_EXPENSIVE: '$$$$',
};

const text = (t?: PlaceText | null): string => t?.text?.trim() ?? '';

/** Human name for a place (displayName, falling back to id). */
export function placeName(place: Place): string {
  return text(place.displayName) || place.id;
}

/** A one-line blurb: editorial summary, then generative summary (no address —
 * the address renders on its own line via placeAddress). */
export function placeBlurb(place: Place): string {
  return text(place.editorialSummary) || text(place.generativeSummary);
}

/** "$$" style price label, or '' when unknown. */
export function priceLabel(place: Place): string {
  return place.priceLevel ? (PRICE_LABELS[place.priceLevel] ?? '') : '';
}

/** The street address, shown as its own line when available (else ''). */
export function placeAddress(place: Place): string {
  return place.formattedAddress?.trim() ?? '';
}

/** Where "Visit website" points: the place's own site if Google has one, else
 * a Google Maps search for the place (name + address) so there's always a
 * useful destination. Returns { href, label }. */
export function placeLink(place: Place): { href: string; label: string } {
  const site = place.websiteUri?.trim();
  if (site) return { href: site, label: 'Website' };
  const q = encodeURIComponent([placeName(place), placeAddress(place)].filter(Boolean).join(' '));
  return { href: `https://www.google.com/maps/search/?api=1&query=${q}`, label: 'View on Maps' };
}
