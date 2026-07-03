import { describe, it, expect } from 'vitest';
import { nomFromRecord, upsertNom } from './nomRecord';
import type { Nom } from './types';

describe('nomFromRecord', () => {
  it('maps a raw record and filters null option ids', () => {
    const nom = nomFromRecord({
      id: 'n1',
      pairingId: 'p1',
      members: ['u1', 'u2'],
      title: 'Fri',
      optionPlaceIds: ['a', null, 'b'],
      status: 'OPEN',
    });
    expect(nom).toEqual({
      id: 'n1',
      pairingId: 'p1',
      members: ['u1', 'u2'],
      title: 'Fri',
      optionPlaceIds: ['a', 'b'],
      selectedPlaceId: null,
      selectedBy: null,
      status: 'OPEN',
    });
  });

  it('defaults missing fields', () => {
    const nom = nomFromRecord({ id: 'n1', pairingId: 'p1' });
    expect(nom.members).toEqual([]);
    expect(nom.optionPlaceIds).toEqual([]);
    expect(nom.title).toBeNull();
  });
});

describe('upsertNom', () => {
  const a: Nom = { id: 'a', pairingId: 'p', members: [], optionPlaceIds: [], status: 'OPEN' };
  const b: Nom = { id: 'b', pairingId: 'p', members: [], optionPlaceIds: [], status: 'OPEN' };

  it('prepends a new nom', () => {
    expect(upsertNom([a], b).map((n) => n.id)).toEqual(['b', 'a']);
  });

  it('replaces an existing nom in place (no dup, keeps order)', () => {
    const updated = { ...a, title: 'changed' };
    const out = upsertNom([a, b], updated);
    expect(out.map((n) => n.id)).toEqual(['a', 'b']);
    expect(out[0].title).toBe('changed');
  });

  it('handles an undefined starting list', () => {
    expect(upsertNom(undefined, a)).toEqual([a]);
  });
});
