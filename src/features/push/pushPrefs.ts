/**
 * Local (per-device) push preferences + diagnostics, kept in localStorage.
 * Split from registerPush.ts to hold the line budget. Two concerns:
 *  - opt-out flag: the user turned push OFF in-app (distinct from iOS
 *    permission), so we don't auto-re-register on the next sign-in.
 *  - last error: the most recent registration failure, surfaced in Settings so
 *    a silent "0 devices registered" bug is visible instead of swallowed.
 */
const OPT_OUT_KEY = 'noms.pushOptOut';
const ERR_KEY = 'noms.pushLastError';

export function isOptedOut(): boolean {
  return localStorage.getItem(OPT_OUT_KEY) === '1';
}

export function setOptOut(v: boolean): void {
  if (v) localStorage.setItem(OPT_OUT_KEY, '1');
  else localStorage.removeItem(OPT_OUT_KEY);
}

/** Record a push failure (console + localStorage) — never swallow silently. */
export function noteError(msg: string): void {
  console.warn('[push]', msg);
  try {
    localStorage.setItem(ERR_KEY, `${new Date().toISOString()} ${msg}`);
  } catch {
    /* ignore */
  }
}

/** The last push-registration error (for Settings diagnostics), or '' if none. */
export function lastPushError(): string {
  return localStorage.getItem(ERR_KEY) ?? '';
}

export function clearPushError(): void {
  localStorage.removeItem(ERR_KEY);
}
