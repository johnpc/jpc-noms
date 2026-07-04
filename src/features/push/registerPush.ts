/**
 * Platform-aware APNs registration. On native iOS: request permission, register
 * with APNs, and on the `registration` event persist the token via
 * registerDevice. No-op on web (Capacitor.isNativePlatform() === false), so the
 * PWA build is unaffected. Errors are swallowed — push is best-effort.
 */
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { registerDevice, unregisterDevice } from './deviceApi';

const native = (): boolean => Capacitor.isNativePlatform();
const OPT_OUT_KEY = 'noms.pushOptOut';

/** Has the user turned push OFF in-app? (Distinct from iOS permission — lets us
 * not auto-re-register on next sign-in.) */
export function isOptedOut(): boolean {
  return localStorage.getItem(OPT_OUT_KEY) === '1';
}
const setOptOut = (v: boolean): void => {
  if (v) localStorage.setItem(OPT_OUT_KEY, '1');
  else localStorage.removeItem(OPT_OUT_KEY);
};

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

  setOptOut(false); // enabling clears any prior in-app opt-out
  await PushNotifications.addListener('registration', (token) => {
    void registerDevice(token.value, ownerSub).catch(() => {});
  });
  await PushNotifications.register();
  return 'granted';
}

/**
 * In-app "turn off": iOS permission stays granted (only iOS Settings can revoke
 * it), but we delete this device's token so the push Lambda can't deliver, and
 * set a local opt-out so we don't auto-re-register on the next sign-in.
 */
export async function disablePush(): Promise<void> {
  setOptOut(true);
  await unregisterDevice().catch(() => {});
}
