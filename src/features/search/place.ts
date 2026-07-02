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

/** A one-line blurb: editorial summary, then generative, then the address. */
export function placeBlurb(place: Place): string {
  return (
    text(place.editorialSummary) || text(place.generativeSummary) || place.formattedAddress || ''
  );
}

/** "$$" style price label, or '' when unknown. */
export function priceLabel(place: Place): string {
  return place.priceLevel ? (PRICE_LABELS[place.priceLevel] ?? '') : '';
}
