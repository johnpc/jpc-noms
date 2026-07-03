import { describe, it, expect } from 'vitest';
import { randomFraction } from './random';

describe('randomFraction', () => {
  it('returns a float in [0, 1)', () => {
    for (let i = 0; i < 50; i++) {
      const r = randomFraction();
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(1);
    }
  });
});
