import { describe, it, expect } from 'vitest';
import { decidePairingNotification, type PairingImage } from './decidePairingNotification';

const img = (over: Partial<PairingImage>): PairingImage => ({ members: ['u1', 'u2'], ...over });

describe('decidePairingNotification', () => {
  it('notifies both members on a new ACTIVE pairing (INSERT)', () => {
    const out = decidePairingNotification('INSERT', img({ status: 'ACTIVE' }), undefined);
    expect(out?.recipientSubs).toEqual(['u1', 'u2']);
    expect(out?.body).toContain('paired');
  });

  it('notifies on pending→active (MODIFY)', () => {
    const out = decidePairingNotification(
      'MODIFY',
      img({ status: 'ACTIVE' }),
      img({ status: 'PENDING' }),
    );
    expect(out?.recipientSubs).toEqual(['u1', 'u2']);
  });

  it('does NOT re-notify when it was already active', () => {
    expect(
      decidePairingNotification('MODIFY', img({ status: 'ACTIVE' }), img({ status: 'ACTIVE' })),
    ).toBeNull();
  });

  it('ignores non-active new state, removes, and missing image', () => {
    expect(decidePairingNotification('INSERT', img({ status: 'PENDING' }), undefined)).toBeNull();
    expect(decidePairingNotification('REMOVE', img({ status: 'ACTIVE' }), undefined)).toBeNull();
    expect(decidePairingNotification('INSERT', undefined, undefined)).toBeNull();
  });
});
