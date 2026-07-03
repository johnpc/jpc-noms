/**
 * Platform-aware APNs registration. On native iOS: request permission, register
 * with APNs, and on the `registration` event persist the token via
 * registerDevice. No-op on web (Capacitor.isNativePlatform() === false), so the
 * PWA build is unaffected. Errors are swallowed — push is best-effort.
 */
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { registerDevice } from './deviceApi';

const native = (): boolean => Capacitor.isNativePlatform();

/** Push permission as the Settings UI needs it. `web` = not a native build
 * (push is iOS-only); `prompt` = not asked yet; `denied` = blocked in iOS. */
export type PushStatus = 'granted' | 'denied' | 'prompt' | 'web';

/** Current push permission for this device — drives the Settings control. */
export async function pushStatus(): Promise<PushStatus> {
  if (!native()) return 'web';
  try {
    const { receive } = await PushNotifications.checkPermissions();
    if (receive === 'granted') return 'granted';
    if (receive === 'denied') return 'denied';
    return 'prompt';
  } catch {
    return 'prompt';
  }
}

/**
 * Request permission + register this device's APNs token for `ownerSub`.
 * Returns the resulting PushStatus so a caller (Settings) can reflect it.
 */
export async function enablePush(ownerSub: string): Promise<PushStatus> {
  if (!native() || !ownerSub) return native() ? 'prompt' : 'web';
  const perm = await PushNotifications.requestPermissions();
  if (perm.receive !== 'granted') return perm.receive === 'denied' ? 'denied' : 'prompt';

  await PushNotifications.addListener('registration', (token) => {
    void registerDevice(token.value, ownerSub).catch(() => {});
  });
  await PushNotifications.register();
  return 'granted';
}
