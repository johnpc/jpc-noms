import { useCallback, useState } from 'react';
import { errorMessage } from './toast';

// @state-machine submission

/**
 * The ONE shape every "press a button, await the network" flow in the app
 * has: idle → busy → done | failed. Sign-in, sign-up, password reset, account
 * actions and scan-to-pair all used to hand-roll `busy` + `error` (+ `message`)
 * booleans with the same try/catch/finally; this owns that lifecycle once, so
 * a form can never be "busy AND failed" and a success can never leave a stale
 * error on screen.
 */
export type Submission =
  | { kind: 'idle' }
  | { kind: 'busy' }
  | { kind: 'failed'; error: string }
  | { kind: 'done'; message: string };

const IDLE: Submission = { kind: 'idle' };

/** Readers derive the familiar flags from the one state. */
export function submissionFlags(state: Submission) {
  return {
    busy: state.kind === 'busy',
    error: state.kind === 'failed' ? state.error : null,
    message: state.kind === 'done' && state.message ? state.message : null,
  };
}

export interface RunOptions {
  /** Shown when the action throws a non-Error (or an Error without a message). */
  fallback: string;
  /** Recorded on success; '' keeps `message` null (silent success). */
  message?: string;
}

/**
 * Owns a Submission. `run` drives idle/busy → done|failed around `fn` and
 * resolves to whether it succeeded, so callers can chain navigation without
 * re-deriving success from state.
 */
export function useSubmission() {
  const [state, setState] = useState<Submission>(IDLE);

  const run = useCallback(async (fn: () => Promise<void>, opts: RunOptions): Promise<boolean> => {
    setState({ kind: 'busy' });
    try {
      await fn();
      setState({ kind: 'done', message: opts.message ?? '' });
      return true;
    } catch (e) {
      setState({ kind: 'failed', error: errorMessage(e, opts.fallback) });
      return false;
    }
  }, []);

  const fail = useCallback((error: string) => setState({ kind: 'failed', error }), []);

  return { state, run, fail, ...submissionFlags(state) };
}
