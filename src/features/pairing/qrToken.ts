/** Pure encode/decode + validation for the QR pairing token. No I/O — tested.
 * The QR encodes the scannee's identity; the scanner turns it into a Pairing. */

export interface PairToken {
  /** Cognito sub (stable user id) of the person showing the code. */
  sub: string;
  /** Their email, for display + the Pairing row's invitee/inviter fields. */
  email: string;
}

const PREFIX = 'noms:pair:';

/** Serialize a token for the QR image (prefixed base64 JSON — namespaced so a
 * stray QR scanned by mistake is rejected). */
export function encodePairToken(t: PairToken): string {
  return PREFIX + btoa(JSON.stringify({ sub: t.sub, email: t.email }));
}

/** Parse a scanned string back to a token, or null if it isn't ours / is malformed. */
export function decodePairToken(raw: string): PairToken | null {
  if (!raw.startsWith(PREFIX)) return null;
  try {
    const obj = JSON.parse(atob(raw.slice(PREFIX.length))) as Partial<PairToken>;
    if (!obj.sub || !obj.email) return null;
    return { sub: obj.sub, email: obj.email };
  } catch {
    return null;
  }
}

/** Build the ACTIVE Pairing input from me + the scanned partner. Returns null
 * if the scan is my own code (can't pair with yourself). */
export function pairingInput(me: PairToken, partner: PairToken) {
  if (me.sub === partner.sub) return null;
  return {
    members: [me.sub, partner.sub],
    inviterEmail: me.email,
    inviteeEmail: partner.email,
    status: 'ACTIVE' as const,
  };
}
