import { describe, it, expect } from 'vitest';
import { encodePairToken, decodePairToken, pairingInput } from './qrToken';

describe('encode/decode pair token', () => {
  it('round-trips a token', () => {
    const t = { sub: 'u1', email: 'a@x.com' };
    expect(decodePairToken(encodePairToken(t))).toEqual(t);
  });

  it('rejects a non-Noms string', () => {
    expect(decodePairToken('https://evil.example')).toBeNull();
    expect(decodePairToken('')).toBeNull();
  });

  it('rejects a Noms-prefixed but malformed payload', () => {
    expect(decodePairToken('noms:pair:not-base64!!')).toBeNull();
    expect(decodePairToken('noms:pair:' + btoa('{"sub":"only"}'))).toBeNull();
  });
});

describe('pairingInput', () => {
  it('builds an ACTIVE pairing with both members', () => {
    const out = pairingInput({ sub: 'me', email: 'me@x.com' }, { sub: 'you', email: 'you@x.com' });
    expect(out).toEqual({
      members: ['me', 'you'],
      inviterEmail: 'me@x.com',
      inviteeEmail: 'you@x.com',
      status: 'ACTIVE',
    });
  });

  it('returns null when scanning your own code', () => {
    expect(
      pairingInput({ sub: 'me', email: 'me@x.com' }, { sub: 'me', email: 'me@x.com' }),
    ).toBeNull();
  });
});
