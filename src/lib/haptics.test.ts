import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({ isNative: vi.fn(), impact: vi.fn() }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: h.isNative } }));
vi.mock('@capacitor/haptics', () => ({
  Haptics: { impact: h.impact },
  ImpactStyle: { Light: 'LIGHT', Medium: 'MEDIUM' },
}));

import { tap, success } from './haptics';

describe('haptics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.impact.mockResolvedValue(undefined);
  });

  it('no-ops on web', async () => {
    h.isNative.mockReturnValue(false);
    await tap();
    await success();
    expect(h.impact).not.toHaveBeenCalled();
  });

  it('fires a light impact for tap on native', async () => {
    h.isNative.mockReturnValue(true);
    await tap();
    expect(h.impact).toHaveBeenCalledWith({ style: 'LIGHT' });
  });

  it('swallows haptics errors', async () => {
    h.isNative.mockReturnValue(true);
    h.impact.mockRejectedValue(new Error('no haptics'));
    await expect(tap()).resolves.toBeUndefined();
  });
});
