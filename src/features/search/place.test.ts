import { describe, it, expect } from 'vitest';
import {
  placeName,
  placeBlurb,
  priceLabel,
  placeAddress,
  placeLink,
  placeHoursToday,
} from './place';
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

describe('placeHoursToday', () => {
  const weekdayDescriptions = [
    'Monday: Closed',
    'Tuesday: 11:00 AM – 9:00 PM',
    'Wednesday: 11:00 AM – 9:00 PM',
    'Thursday: 11:00 AM – 9:00 PM',
    'Friday: 11:00 AM – 10:00 PM',
    'Saturday: 10:00 AM – 10:00 PM',
    'Sunday: 10:00 AM – 8:00 PM',
  ];
  const withHours: Place = { ...base, regularOpeningHours: { weekdayDescriptions } };

  it("picks today's line from the Monday-first list (JS days are Sunday-first)", () => {
    // 2026-09-25 is a Friday.
    expect(placeHoursToday(withHours, new Date(2026, 8, 25))).toBe('Today: 11:00 AM – 10:00 PM');
    // 2026-09-27 is a Sunday — the LAST entry, not the first.
    expect(placeHoursToday(withHours, new Date(2026, 8, 27))).toBe('Today: 10:00 AM – 8:00 PM');
  });

  it('strips the weekday prefix but keeps "Closed"', () => {
    // 2026-09-28 is a Monday.
    expect(placeHoursToday(withHours, new Date(2026, 8, 28))).toBe('Today: Closed');
  });

  it('is empty when hours are unknown', () => {
    expect(placeHoursToday(base, new Date(2026, 8, 25))).toBe('');
    expect(
      placeHoursToday(
        { ...base, regularOpeningHours: { weekdayDescriptions: [] } },
        new Date(2026, 8, 25),
      ),
    ).toBe('');
  });
});

describe('placeLink', () => {
  it('links to the place website when Google provides one', () => {
    const l = placeLink({ ...base, websiteUri: 'https://joes.example' });
    expect(l).toEqual({ href: 'https://joes.example', label: 'Website' });
  });
  it('falls back to a Google Maps search (name + address) when no website', () => {
    const l = placeLink({ ...base, formattedAddress: '1 Main St' });
    expect(l.label).toBe('View on Maps');
    expect(l.href).toContain('google.com/maps/search/');
    expect(l.href).toContain(encodeURIComponent("Joe's Pizza 1 Main St"));
  });
});
