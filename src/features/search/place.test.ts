import { describe, it, expect } from 'vitest';
import { placeName, placeBlurb, priceLabel, placeAddress } from './place';
import type { Place } from './types';

const base: Place = { id: 'p1', name: 'places/p1', displayName: { text: "Joe's Pizza" } };

describe('placeName', () => {
  it('uses displayName text', () => {
    expect(placeName(base)).toBe("Joe's Pizza");
  });
  it('falls back to id when displayName is empty', () => {
    expect(placeName({ ...base, displayName: { text: '' } })).toBe('p1');
  });
});

describe('placeBlurb', () => {
  it('prefers the editorial summary', () => {
    expect(placeBlurb({ ...base, editorialSummary: { text: 'Cozy slice shop' } })).toBe(
      'Cozy slice shop',
    );
  });
  it('does NOT fall back to the address (that renders on its own line)', () => {
    expect(placeBlurb({ ...base, formattedAddress: '1 Main St' })).toBe('');
  });
  it('is empty when no summaries are available', () => {
    expect(placeBlurb(base)).toBe('');
  });
});

describe('placeAddress', () => {
  it('returns the formatted address when present', () => {
    expect(placeAddress({ ...base, formattedAddress: '1 Main St' })).toBe('1 Main St');
  });
  it('is empty when absent', () => {
    expect(placeAddress(base)).toBe('');
  });
});

describe('priceLabel', () => {
  it('maps a known price level', () => {
    expect(priceLabel({ ...base, priceLevel: 'PRICE_LEVEL_MODERATE' })).toBe('$$');
  });
  it('is empty for unknown or missing levels', () => {
    expect(priceLabel(base)).toBe('');
    expect(priceLabel({ ...base, priceLevel: 'WAT' })).toBe('');
  });
});
