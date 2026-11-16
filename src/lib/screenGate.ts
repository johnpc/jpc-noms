/**
 * The two states EVERY signed-in screen shares before it has anything of its
 * own to show. Page hooks call this first and only compute their own screen
 * kinds once it returns null, so "signed-out" and "loading" are spelled the
 * same way (and tested once) across today / noms / detail / rotation / stats /
 * pairing instead of as nested ternaries in each component.
 */
export type GateScreen = { kind: 'signed-out' } | { kind: 'loading' };

export function screenGate(signedIn: boolean, loading: boolean): GateScreen | null {
  if (!signedIn) return { kind: 'signed-out' };
  if (loading) return { kind: 'loading' };
  return null;
}
