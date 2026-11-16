/**
 * Platform-aware APNs registration. On native iOS: request permission, register
 * with APNs, and on the `registration` event persist the token via
 * registerDevice. No-op on web (Capacitor.isNativePlatform() === false).
 *
 * Every step drives the PushRegistration machine (pushStore) so Settings shows
 * the real phase instead of guessing; failures ALSO land in the localStorage
 * breadcrumb (lastPushError) so a device can be diagnosed after a relaunch.
 */
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { registerDevice, unregisterDevice } from './deviceApi';
import { setOptOut, noteError } from './pushPrefs';
import { dispatchPush } from './pushStore';

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

const fail = (reason: string) => {
  noteError(reason);
  dispatchPush({ type: 'error', reason });
};

/**
 * Request permission + register this device's APNs token for `ownerSub`. The
 * outcome is published through the machine; this resolves once iOS has been
 * asked to register (the token itself arrives on the listener).
 */
export async function enablePush(ownerSub: string): Promise<void> {
  if (!native() || !ownerSub) return;
  dispatchPush({ type: 'start' });
  try {
    const perm = await PushNotifications.requestPermissions();
    const next = dispatchPush({ type: 'permission', receive: perm.receive });
    if (next.kind !== 'awaiting-token')
      return noteError(`permission not granted (${perm.receive})`);

    setOptOut(false); // enabling clears any prior in-app opt-out
    // Remove any prior listeners first — enablePush can run more than once per
    // launch, and stacking duplicate listeners was a latent bug. Then attach
    // BOTH before register() so neither event is missed.
    await PushNotifications.removeAllListeners();
    await PushNotifications.addListener('registration', (token) => {
      dispatchPush({ type: 'token', token: token.value });
      void registerDevice(token.value, ownerSub)
        .then(() => dispatchPush({ type: 'saved' }))
        .catch((e: unknown) => fail(`registerDevice failed: ${String(e)}`));
    });
    await PushNotifications.addListener('registrationError', (err) => {
      fail(`APNs registrationError: ${JSON.stringify(err)}`);
    });
    await PushNotifications.register();
  } catch (e) {
    fail(`enablePush threw: ${String(e)}`);
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
  dispatchPush({ type: 'reset' });
}
