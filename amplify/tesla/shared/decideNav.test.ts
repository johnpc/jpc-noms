import { describe, it, expect } from 'vitest';
import { decideNav, type NavImage } from './decideNav';

const img = (over: Partial<NavImage>): NavImage => ({ members: ['u1', 'u2'], ...over });

describe('decideNav', () => {
  it('returns the place id when a real selection is newly set (any member, no allowlist)', () => {
    const out = decideNav(
      'MODIFY',
      img({ selectedPlaceId: 'p1' }),
      img({ selectedPlaceId: undefined }),
      [],
    );
    expect(out).toBe('p1');
  });

  it('is null when the selection is unchanged', () => {
    expect(
      decideNav('MODIFY', img({ selectedPlaceId: 'p1' }), img({ selectedPlaceId: 'p1' }), []),
    ).toBeNull();
  });

  it('is null for NONE / empty selection', () => {
    expect(decideNav('MODIFY', img({ selectedPlaceId: 'NONE' }), img({}), [])).toBeNull();
    expect(decideNav('MODIFY', img({ selectedPlaceId: undefined }), img({}), [])).toBeNull();
  });

  it('honors the allowlist — fires only if a member is allowed', () => {
    expect(
      decideNav('MODIFY', img({ members: ['u1'], selectedPlaceId: 'p1' }), img({}), ['u1']),
    ).toBe('p1');
    expect(
      decideNav('MODIFY', img({ members: ['stranger'], selectedPlaceId: 'p1' }), img({}), ['u1']),
    ).toBeNull();
  });

  it('is null for non-insert/modify events or missing image', () => {
    expect(decideNav('REMOVE', img({ selectedPlaceId: 'p1' }), img({}), [])).toBeNull();
    expect(decideNav('MODIFY', undefined, img({}), [])).toBeNull();
  });

  it('fires on INSERT of an already-selected nom', () => {
    expect(decideNav('INSERT', img({ selectedPlaceId: 'p1' }), undefined, [])).toBe('p1');
  });
});
