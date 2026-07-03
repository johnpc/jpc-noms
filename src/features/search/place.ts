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
