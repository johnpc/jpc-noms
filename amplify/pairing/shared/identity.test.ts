import { describe, it, expect } from 'vitest';
import { callerSub, normalizeEmail } from './identity';

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

describe('normalizeEmail', () => {
  it('lowercases + trims a caller-supplied email', () => {
    expect(normalizeEmail('  Ann@Example.COM ')).toBe('ann@example.com');
  });
  it('throws when the email is missing/empty', () => {
    expect(() => normalizeEmail(undefined)).toThrow('Missing caller email');
    expect(() => normalizeEmail('   ')).toThrow('Missing caller email');
  });
});
