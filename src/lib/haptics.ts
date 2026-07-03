/**
 * Subtle tactile feedback on key actions (add/select/pair). Native-only via
 * @capacitor/haptics; a no-op on web so the PWA is unaffected. Best-effort —
 * failures are swallowed (haptics are never load-bearing).
 */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

/** A light impact tap. No-op on web / when haptics are unavailable. */
export async function tap(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    /* haptics unavailable — ignore */
  }
}

/** A stronger success buzz (e.g. paired, decided). */
export async function success(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    /* ignore */
  }
}
