import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  isNative: vi.fn(),
  requestPermissions: vi.fn(),
  scan: vi.fn(),
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: h.isNative } }));
vi.mock('@capacitor-mlkit/barcode-scanning', () => ({
  BarcodeScanner: { requestPermissions: h.requestPermissions, scan: h.scan },
  BarcodeFormat: { QrCode: 'QR_CODE' },
}));

import { scanQr } from './scanner';

describe('scanQr', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null on web (not native)', async () => {
    h.isNative.mockReturnValue(false);
    expect(await scanQr()).toBeNull();
    expect(h.requestPermissions).not.toHaveBeenCalled();
  });

  it('returns null when camera permission is denied', async () => {
    h.isNative.mockReturnValue(true);
    h.requestPermissions.mockResolvedValue({ camera: 'denied' });
    expect(await scanQr()).toBeNull();
    expect(h.scan).not.toHaveBeenCalled();
  });

  it('returns the first barcode value when granted', async () => {
    h.isNative.mockReturnValue(true);
    h.requestPermissions.mockResolvedValue({ camera: 'granted' });
    h.scan.mockResolvedValue({ barcodes: [{ rawValue: 'noms:pair:abc' }] });
    expect(await scanQr()).toBe('noms:pair:abc');
  });

  it('returns null when no barcode is found', async () => {
    h.isNative.mockReturnValue(true);
    h.requestPermissions.mockResolvedValue({ camera: 'limited' });
    h.scan.mockResolvedValue({ barcodes: [] });
    expect(await scanQr()).toBeNull();
  });
});
