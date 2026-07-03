import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { encodePairToken } from './qrToken';

const h = vi.hoisted(() => ({
  auth: { sub: 'me' as string | null, email: 'me@x.com' as string | null },
  scanQr: vi.fn(),
  mutateAsync: vi.fn(),
}));
vi.mock('../auth/useAuth', () => ({ useAuth: () => h.auth }));
vi.mock('./scanner', () => ({ scanQr: h.scanQr }));
vi.mock('./pairingApi', () => ({
  usePairByScan: () => ({ mutateAsync: h.mutateAsync, isPending: false }),
}));

import { useScanToPair } from './useScanToPair';

describe('useScanToPair', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.auth = { sub: 'me', email: 'me@x.com' };
    h.mutateAsync.mockResolvedValue({});
  });

  it('exposes my QR token that decodes back to my identity', () => {
    const { result } = renderHook(() => useScanToPair());
    expect(result.current.myCode).toContain('noms:pair:');
  });

  it('scans a partner code and pairs', async () => {
    h.scanQr.mockResolvedValue(encodePairToken({ sub: 'you', email: 'you@x.com' }));
    const { result } = renderHook(() => useScanToPair());
    await act(async () => result.current.scan());
    expect(h.mutateAsync).toHaveBeenCalledWith({
      me: { sub: 'me', email: 'me@x.com' },
      partner: { sub: 'you', email: 'you@x.com' },
    });
  });

  it('does nothing when the scan is cancelled (null)', async () => {
    h.scanQr.mockResolvedValue(null);
    const { result } = renderHook(() => useScanToPair());
    await act(async () => result.current.scan());
    expect(h.mutateAsync).not.toHaveBeenCalled();
  });

  it('errors on a non-Noms QR', async () => {
    h.scanQr.mockResolvedValue('https://example.com');
    const { result } = renderHook(() => useScanToPair());
    await act(async () => result.current.scan());
    await waitFor(() => expect(result.current.error).toMatch(/Noms pairing code/));
    expect(h.mutateAsync).not.toHaveBeenCalled();
  });

  it('surfaces a pairing failure (e.g. own code)', async () => {
    h.scanQr.mockResolvedValue(encodePairToken({ sub: 'you', email: 'you@x.com' }));
    h.mutateAsync.mockRejectedValue(new Error("That's your own code — scan your partner's."));
    const { result } = renderHook(() => useScanToPair());
    await act(async () => result.current.scan());
    await waitFor(() => expect(result.current.error).toMatch(/own code/));
  });
});
