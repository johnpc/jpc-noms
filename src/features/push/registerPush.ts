/**
 * Platform-aware APNs registration. On native iOS: request permission, register
 * with APNs, and on the `registration` event persist the token via
 * registerDevice. No-op on web (Capacitor.isNativePlatform() === false).
 *
 * Failures are NO LONGER swallowed silently (that hid a "0 devices registered"
 * bug): the APNs `registrationError` + any registerDevice failure are recorded
 * in localStorage (lastPushError) so Settings can surface why push isn't working.
 */
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { registerDevice, unregisterDevice } from './deviceApi';
import { setOptOut, noteError } from './pushPrefs';

const native = (): boolean => Capacitor.isNativePlatform();

export { isOptedOut, lastPushError } from './pushPrefs';

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
  try {
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== 'granted') {
      noteError(`permission not granted (${perm.receive})`);
      return perm.receive === 'denied' ? 'denied' : 'prompt';
    }

    setOptOut(false); // enabling clears any prior in-app opt-out
    // Remove any prior listeners first — usePushRegistration calls this on every
    // launch, and stacking duplicate listeners was a latent bug. Then attach
    // BOTH before register() so neither event is missed. The registration event
    // carries the APNs token; registrationError means iOS couldn't register.
    await PushNotifications.removeAllListeners();
    await PushNotifications.addListener('registration', (token) => {
      void registerDevice(token.value, ownerSub)
        .then(() => noteError(`registered token ok (${token.value.slice(0, 8)}…)`))
        .catch((e: unknown) => noteError(`registerDevice failed: ${String(e)}`));
    });
    await PushNotifications.addListener('registrationError', (err) => {
      noteError(`APNs registrationError: ${JSON.stringify(err)}`);
    });
    noteError('register() called — awaiting APNs token…');
    await PushNotifications.register();
    return 'granted';
  } catch (e) {
    noteError(`enablePush threw: ${String(e)}`);
    return 'prompt';
  }
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
