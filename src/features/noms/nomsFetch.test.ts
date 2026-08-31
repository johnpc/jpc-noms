import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Nom } from './types';

const m = vi.hoisted(() => ({ list: vi.fn(), recent: vi.fn() }));
vi.mock('../../lib/dataClient', () => ({
  dataClient: {
    models: { Nom: { list: m.list, listNomByPairingIdAndUpdatedAt: m.recent } },
  },
}));

import { fetchNoms, resetNomsFetch, RECENT_LIMIT } from './nomsFetch';

const nom = (id: string, over: Partial<Nom> = {}): Nom => ({
  id,
  pairingId: 'p1',
  members: ['u1'],
  createdAt: null,
  optionPlaceIds: [],
  selectedPlaceId: null,
  selectedBy: null,
  status: 'OPEN',
  ...over,
});

describe('fetchNoms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetNomsFetch();
  });

  it('pages the FULL history on the first call of a session', async () => {
    m.list
      .mockResolvedValueOnce({ data: [{ id: 'a' }], nextToken: 't1' })
      .mockResolvedValueOnce({ data: [{ id: 'b' }], nextToken: null });
    const result = await fetchNoms(undefined, 'p1', 'u1');
    expect(result.map((n) => n.id)).toEqual(['a', 'b']);
    expect(m.list).toHaveBeenCalledTimes(2);
    expect(m.recent).not.toHaveBeenCalled();
  });

  it('polls only recently-updated noms after the first load, merged over the cache', async () => {
    m.list.mockResolvedValue({ data: [{ id: 'old' }, { id: 'a', status: 'OPEN' }] });
    const first = await fetchNoms(undefined, 'p1', 'u1');

    m.recent.mockResolvedValue({ data: [{ id: 'a', status: 'SELECTED' }, { id: 'new' }] });
    const second = await fetchNoms(first, 'p1', 'u1');

    // One small GSI query — no re-paging.
    expect(m.list).toHaveBeenCalledTimes(1);
    expect(m.recent).toHaveBeenCalledWith(
      { pairingId: 'p1' },
      { authMode: 'userPool', sortDirection: 'DESC', limit: RECENT_LIMIT },
    );
    // The updated row replaced its cached version; untouched history is kept.
    expect(second.find((n) => n.id === 'a')?.status).toBe('SELECTED');
    expect(second.some((n) => n.id === 'old')).toBe(true);
    expect(second.some((n) => n.id === 'new')).toBe(true);
  });

  it('keeps rows from OTHER pairing partitions (pre-pairing solo noms) on a poll', async () => {
    m.list.mockResolvedValue({ data: [{ id: 'solo-era', pairingId: 'solo' }] });
    const first = await fetchNoms(undefined, 'p1', 'u1');
    m.recent.mockResolvedValue({ data: [] });
    const second = await fetchNoms(first, 'p1', 'u1');
    expect(second.map((n) => n.id)).toEqual(['solo-era']);
  });

  it('re-pages the full history when the cache was emptied (react-query GC)', async () => {
    m.list.mockResolvedValue({ data: [nom('a')] });
    await fetchNoms(undefined, 'p1', 'u1');
    await fetchNoms(undefined, 'p1', 'u1');
    expect(m.list).toHaveBeenCalledTimes(2);
    expect(m.recent).not.toHaveBeenCalled();
  });

  it('re-pages the full history when a DIFFERENT user signs in', async () => {
    m.list.mockResolvedValue({ data: [nom('a')] });
    await fetchNoms(undefined, 'p1', 'u1');
    await fetchNoms(undefined, 'p2', 'u2');
    expect(m.list).toHaveBeenCalledTimes(2);
    expect(m.recent).not.toHaveBeenCalled();
  });

  it('does not mark history loaded if the full load throws', async () => {
    m.list.mockRejectedValueOnce(new Error('net'));
    await expect(fetchNoms(undefined, 'p1', 'u1')).rejects.toThrow('net');
    m.list.mockResolvedValue({ data: [nom('a')] });
    const result = await fetchNoms(undefined, 'p1', 'u1');
    expect(result.map((n) => n.id)).toEqual(['a']);
    expect(m.recent).not.toHaveBeenCalled();
  });
});
