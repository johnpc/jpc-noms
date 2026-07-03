import { describe, it, expect } from 'vitest';
import { withOption, isSelected, nomSummary } from './nom';
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
