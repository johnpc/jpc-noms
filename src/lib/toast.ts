/**
 * Imperative toast — decoupled from the React tree so cross-cutting concerns
 * (e.g. the react-query mutation error handler) can surface a message. Isolated
 * here so callers/tests mock a single module.
 */
import { toastController } from '@ionic/core';

/** Show a short error toast at the bottom. Best-effort — never throws. */
export async function showError(message: string): Promise<void> {
  try {
    const t = await toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'danger',
    });
    await t.present();
  } catch {
    /* toast unavailable (e.g. SSR/test) — ignore */
  }
}

/** Human-readable message from an unknown thrown value. */
export function errorMessage(err: unknown, fallback = 'Something went wrong.'): string {
  return err instanceof Error && err.message ? err.message : fallback;
}
