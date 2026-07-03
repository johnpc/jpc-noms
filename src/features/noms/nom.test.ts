import { describe, it, expect } from 'vitest';
import {
  withOption,
  withoutOption,
  pickRandomOption,
  isSelected,
  nomSummary,
  selectedByLabel,
  nomDateLabel,
  firstOpenNom,
} from './nom';
import type { Nom } from './types';

const nom = (over: Partial<Nom>): Nom => ({
  id: 'n1',
  pairingId: 'p1',
  members: ['u1', 'u2'],
  optionPlaceIds: [],
  status: 'OPEN',
  ...over,
});

describe('withOption', () => {
  it('appends a new place id', () => {
    expect(withOption(nom({ optionPlaceIds: ['a'] }), 'b')).toEqual(['a', 'b']);
  });
  it('does not duplicate an existing id', () => {
    expect(withOption(nom({ optionPlaceIds: ['a'] }), 'a')).toEqual(['a']);
  });
});

describe('isSelected', () => {
  it('is true only with SELECTED status and a place id', () => {
    expect(isSelected(nom({ status: 'SELECTED', selectedPlaceId: 'a' }))).toBe(true);
    expect(isSelected(nom({ status: 'SELECTED' }))).toBe(false);
    expect(isSelected(nom({ status: 'OPEN', selectedPlaceId: 'a' }))).toBe(false);
  });
});

describe('nomSummary', () => {
  it('summarizes options and selection', () => {
    expect(nomSummary(nom({}))).toBe('No options yet');
    expect(nomSummary(nom({ optionPlaceIds: ['a'] }))).toBe('1 option');
    expect(nomSummary(nom({ optionPlaceIds: ['a', 'b'] }))).toBe('2 options');
    expect(nomSummary(nom({ status: 'SELECTED', selectedPlaceId: 'a' }))).toBe('Selected');
  });
});

describe('withoutOption', () => {
  it('removes the given id and leaves the rest', () => {
    expect(withoutOption(nom({ optionPlaceIds: ['a', 'b', 'c'] }), 'b')).toEqual(['a', 'c']);
  });
  it('is a no-op when the id is absent', () => {
    expect(withoutOption(nom({ optionPlaceIds: ['a'] }), 'z')).toEqual(['a']);
  });
});

describe('pickRandomOption', () => {
  it('picks by the injected fraction (deterministic)', () => {
    const n = nom({ optionPlaceIds: ['a', 'b', 'c'] });
    expect(pickRandomOption(n, 0)).toBe('a');
    expect(pickRandomOption(n, 0.5)).toBe('b');
    expect(pickRandomOption(n, 0.99)).toBe('c');
  });
  it('returns null when there are no options', () => {
    expect(pickRandomOption(nom({ optionPlaceIds: [] }), 0.5)).toBeNull();
  });
});

describe('selectedByLabel', () => {
  it('credits who picked', () => {
    expect(selectedByLabel(nom({ selectedBy: 'Emily' }))).toBe('Emily picked this');
  });
  it('is empty when unknown', () => {
    expect(selectedByLabel(nom({}))).toBe('');
  });
});

describe('nomDateLabel', () => {
  it('formats the createdAt date', () => {
    // A fixed ISO date renders a weekday/month/day label (locale-formatted).
    const label = nomDateLabel(nom({ createdAt: '2026-07-03T12:00:00.000Z' }));
    expect(label).toMatch(/Jul/);
    expect(label).toMatch(/3/);
  });
  it('falls back when the date is missing', () => {
    expect(nomDateLabel(nom({ createdAt: null }))).toBe('New nom');
  });
});

describe('firstOpenNom', () => {
  it('returns the first OPEN nom', () => {
    const selected = nom({ id: 's', status: 'SELECTED', selectedPlaceId: 'a' });
    const open = nom({ id: 'o', status: 'OPEN' });
    expect(firstOpenNom([selected, open])?.id).toBe('o');
  });
  it('is undefined when none are open', () => {
    expect(firstOpenNom([nom({ status: 'SELECTED', selectedPlaceId: 'a' })])).toBeUndefined();
    expect(firstOpenNom([])).toBeUndefined();
  });
});
