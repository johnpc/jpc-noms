/**
 * The one live PushRegistration for this JS session: a tiny external store so
 * registerPush (effects) writes it and React (useSyncExternalStore) reads it.
 * Module-level on purpose — the APNs flow outlives any one screen.
 */
import { PUSH_IDLE, pushReduce, type PushEvent, type PushRegistration } from './pushMachine';

let state: PushRegistration = PUSH_IDLE;
const listeners = new Set<() => void>();

export function getPushState(): PushRegistration {
  return state;
}

export function dispatchPush(event: PushEvent): PushRegistration {
  const next = pushReduce(state, event);
  if (next !== state) {
    state = next;
    listeners.forEach((l) => l());
  }
  return state;
}

export function subscribePush(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
