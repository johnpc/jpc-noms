/**
 * Randomness edge, isolated so callers stay deterministic in tests (mock this
 * one module rather than the global Math.random). Returns a float in [0, 1).
 */
export function randomFraction(): number {
  return Math.random();
}
