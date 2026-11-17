import { describe, it, expect } from 'vitest';
import { screenGate } from './screenGate';

describe('screenGate', () => {
  it('is signed-out first, regardless of loading', () => {
    expect(screenGate(false, true)).toEqual({ kind: 'signed-out' });
    expect(screenGate(false, false)).toEqual({ kind: 'signed-out' });
  });
  it('is loading while signed in and the first fetch is pending', () => {
    expect(screenGate(true, true)).toEqual({ kind: 'loading' });
  });
  it('passes (null) once signed in with data', () => {
    expect(screenGate(true, false)).toBeNull();
  });
});
