/**
 * Native QR scan edge (ML Kit). Isolated so the flow hook stays testable and
 * web builds don't pull the camera. Returns the raw scanned string, or null if
 * unavailable / cancelled / no permission.
 */
import { Capacitor } from '@capacitor/core';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';

const native = (): boolean => Capacitor.isNativePlatform();

/** Scan a single QR and return its raw value, or null. No-op on web. */
export async function scanQr(): Promise<string | null> {
  if (!native()) return null;
  const { camera } = await BarcodeScanner.requestPermissions();
  if (camera !== 'granted' && camera !== 'limited') return null;
  const { barcodes } = await BarcodeScanner.scan({ formats: [BarcodeFormat.QrCode] });
  return barcodes[0]?.rawValue ?? null;
}
