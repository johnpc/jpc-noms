import { describe, it, expect } from 'vitest';
import { nomFromRecord, upsertNom, removeNom } from './nomRecord';
import type { Nom } from './types';

describe('nomFromRecord', () => {
  it('maps a raw record and filters null option ids', () => {
    const nom = nomFromRecord({
      id: 'n1',
      pairingId: 'p1',
      members: ['u1', 'u2'],
      createdAt: '2026-07-03T12:00:00.000Z',
      optionPlaceIds: ['a', null, 'b'],
      status: 'OPEN',
    });
    expect(nom).toEqual({
      id: 'n1',
      pairingId: 'p1',
      members: ['u1', 'u2'],
      createdAt: '2026-07-03T12:00:00.000Z',
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
    expect(nom.createdAt).toBeNull();
  });
});

describe('upsertNom', () => {
  const a: Nom = { id: 'a', pairingId: 'p', members: [], optionPlaceIds: [], status: 'OPEN' };
  const b: Nom = { id: 'b', pairingId: 'p', members: [], optionPlaceIds: [], status: 'OPEN' };

  it('prepends a new nom', () => {
    expect(upsertNom([a], b).map((n) => n.id)).toEqual(['b', 'a']);
  });

  it('replaces an existing nom in place (no dup, keeps order)', () => {
    const updated = { ...a, status: 'SELECTED' as const, selectedPlaceId: 'x' };
    const out = upsertNom([a, b], updated);
    expect(out.map((n) => n.id)).toEqual(['a', 'b']);
    expect(out[0].status).toBe('SELECTED');
  });

  it('handles an undefined starting list', () => {
    expect(upsertNom(undefined, a)).toEqual([a]);
  });
});

describe('removeNom', () => {
  const a: Nom = { id: 'a', pairingId: 'p', members: [], optionPlaceIds: [], status: 'OPEN' };
  const b: Nom = { id: 'b', pairingId: 'p', members: [], optionPlaceIds: [], status: 'OPEN' };

  it('drops the nom with the given id', () => {
    expect(removeNom([a, b], 'a').map((n) => n.id)).toEqual(['b']);
  });
  it('is a no-op for an unknown id / undefined list', () => {
    expect(removeNom([a], 'z')).toEqual([a]);
    expect(removeNom(undefined, 'a')).toEqual([]);
  });
});
