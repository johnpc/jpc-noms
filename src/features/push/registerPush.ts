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

/** Request permission + register this device's APNs token for `ownerSub`. */
export async function enablePush(ownerSub: string): Promise<void> {
  if (!native() || !ownerSub) return;
  const perm = await PushNotifications.requestPermissions();
  if (perm.receive !== 'granted') return;

  await PushNotifications.addListener('registration', (token) => {
    void registerDevice(token.value, ownerSub).catch(() => {});
  });
  await PushNotifications.register();
}
