/**
 * Pure APNs registration machine — no I/O, unit-tested. The device-token
 * dance used to be breadcrumbs in localStorage plus a 1.5 s sleep in Settings
 * hoping the token "had landed"; now every step is a state and the UI reads
 * it. Permission is asked, then iOS hands us a token (or an error), then the
 * token is saved as a Device row for the push Lambda.
 */

// @state-machine push-registration

export type PushPermission = 'granted' | 'denied' | 'prompt';

export type PushRegistration =
  | { kind: 'idle' }
  | { kind: 'requesting' }
  | { kind: 'awaiting-token' }
  | { kind: 'saving'; token: string }
  | { kind: 'registered'; token: string }
  | { kind: 'failed'; reason: string; permission: PushPermission };

export type PushEvent =
  | { type: 'start' }
  | { type: 'permission'; receive: string }
  | { type: 'token'; token: string }
  | { type: 'saved' }
  | { type: 'error'; reason: string }
  | { type: 'reset' };

export const PUSH_IDLE: PushRegistration = { kind: 'idle' };

/** Is the flow mid-way (the UI shows "Registering…")? */
export function isPushWorking(s: PushRegistration): boolean {
  return s.kind === 'requesting' || s.kind === 'awaiting-token' || s.kind === 'saving';
}

/** The latest failure reason, or '' — Settings shows this as the diagnostic. */
export function pushFailure(s: PushRegistration): string {
  return s.kind === 'failed' ? s.reason : '';
}

export function pushReduce(state: PushRegistration, event: PushEvent): PushRegistration {
  switch (event.type) {
    case 'start':
      return isPushWorking(state) ? state : { kind: 'requesting' };
    case 'permission':
      if (state.kind !== 'requesting') return state;
      if (event.receive === 'granted') return { kind: 'awaiting-token' };
      return {
        kind: 'failed',
        reason: `permission not granted (${event.receive})`,
        permission: event.receive === 'denied' ? 'denied' : 'prompt',
      };
    case 'token':
      return state.kind === 'awaiting-token' ? { kind: 'saving', token: event.token } : state;
    case 'saved':
      return state.kind === 'saving' ? { kind: 'registered', token: state.token } : state;
    case 'error':
      return { kind: 'failed', reason: event.reason, permission: 'granted' };
    case 'reset':
      return PUSH_IDLE;
  }
}
