import { describe, it, expect } from 'vitest';
import { LOADING, SIGNED_OUT, publishAuthStatus, sessionFrom } from './authSession';

describe('sessionFrom', () => {
  it('maps a resolved identity to the authenticated arm', () => {
    expect(sessionFrom({ email: 'a@b.com', sub: 's1' })).toEqual({
      status: 'authenticated',
      email: 'a@b.com',
      sub: 's1',
    });
  });
  it('maps a missing identity to signed-out', () => {
    expect(sessionFrom(null)).toEqual(SIGNED_OUT);
    expect(SIGNED_OUT.email).toBeNull();
    expect(LOADING.status).toBe('loading');
  });
});

describe('publishAuthStatus', () => {
  it('writes the status onto the document dataset', () => {
    const doc = { dataset: {} as DOMStringMap };
    expect(publishAuthStatus(doc, LOADING)).toBe('loading');
    expect(doc.dataset.auth).toBe('loading');
    publishAuthStatus(doc, sessionFrom({ email: 'a', sub: 'b' }));
    expect(doc.dataset.auth).toBe('authenticated');
  });
});
