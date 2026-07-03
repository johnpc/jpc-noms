import { describe, it, expect } from 'vitest';
import { callerSub, callerEmail } from './identity';

describe('callerSub', () => {
  it('reads sub from identity', () => {
    expect(callerSub({ sub: 'u1' })).toBe('u1');
  });
  it('falls back to claims.sub', () => {
    expect(callerSub({ claims: { sub: 'u2' } })).toBe('u2');
  });
  it('throws when unauthenticated', () => {
    expect(() => callerSub(undefined)).toThrow('Unauthenticated');
    expect(() => callerSub({})).toThrow('Unauthenticated');
  });
});

describe('callerEmail', () => {
  it('lowercases + trims the email claim', () => {
    expect(callerEmail({ claims: { email: '  Ann@Example.COM ' } })).toBe('ann@example.com');
  });
  it('throws when no email claim', () => {
    expect(() => callerEmail({ claims: {} })).toThrow('No email claim');
  });
});
