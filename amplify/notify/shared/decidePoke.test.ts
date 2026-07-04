import { describe, it, expect } from 'vitest';
import { decidePoke } from './decidePoke';

describe('decidePoke', () => {
  it('names the poker when a label is given', () => {
    const n = decidePoke('john@x.com');
    expect(n.title).toBe('jpc.noms');
    expect(n.body).toContain('john@x.com');
    expect(n.body).toContain('poked you');
  });

  it('falls back to a generic nudge when no label', () => {
    expect(decidePoke(undefined).body).toContain("You've been poked");
    expect(decidePoke('   ').body).toContain("You've been poked");
  });
});
