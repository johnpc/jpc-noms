import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';

const m = vi.hoisted(() => ({ list: vi.fn(), create: vi.fn(), del: vi.fn() }));
vi.mock('../../lib/dataClient', () => ({
  dataClient: { models: { Rotation: { list: m.list, create: m.create, delete: m.del } } },
}));

import { useRotation, useAddToRotation, useRemoveFromRotation } from './rotationApi';

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('rotationApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.create.mockResolvedValue({});
    m.del.mockResolvedValue({});
  });

  it('useRotation maps rows to {id, googlePlaceId} via userPool', async () => {
    m.list.mockResolvedValue({ data: [{ id: 'r1', googlePlaceId: 'p1', extra: 'x' }] });
    const { result } = renderHook(() => useRotation(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 'r1', googlePlaceId: 'p1' }]);
    expect(m.list).toHaveBeenCalledWith({ authMode: 'userPool' });
  });

  it('useRotation does not fetch when disabled (no session yet)', () => {
    const { result } = renderHook(() => useRotation(false), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
    expect(m.list).not.toHaveBeenCalled();
  });

  it('useAddToRotation creates with userPool', async () => {
    const { result } = renderHook(() => useAddToRotation(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync('p9');
    });
    expect(m.create).toHaveBeenCalledWith({ googlePlaceId: 'p9' }, { authMode: 'userPool' });
  });

  it('useRemoveFromRotation deletes by id with userPool', async () => {
    const { result } = renderHook(() => useRemoveFromRotation(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync('r1');
    });
    expect(m.del).toHaveBeenCalledWith({ id: 'r1' }, { authMode: 'userPool' });
  });
});
