import { describe, it, expect } from 'vitest';
import { pairingView } from './pairing';
import type { Pairing } from './types';

const p = (over: Partial<Pairing>): Pairing => ({
  id: 'p1',
  members: ['u1'],
  inviterEmail: 'a@x.com',
  inviteeEmail: 'b@x.com',
  status: 'PENDING',
  ...over,
});

describe('pairingView', () => {
  it('is none when there is no pairing', () => {
    expect(pairingView(null, 'a@x.com')).toEqual({ kind: 'none' });
  });

  it('is pending-sent for the inviter', () => {
    expect(pairingView(p({}), 'a@x.com')).toEqual({
      kind: 'pending-sent',
      partnerEmail: 'b@x.com',
    });
  });

  it('is pending-received (with id) for the invitee', () => {
    expect(pairingView(p({}), 'B@X.com')).toEqual({
      kind: 'pending-received',
      partnerEmail: 'a@x.com',
      pairingId: 'p1',
    });
  });

  it('is active for either member once ACTIVE', () => {
    expect(pairingView(p({ status: 'ACTIVE', members: ['u1', 'u2'] }), 'a@x.com')).toEqual({
      kind: 'active',
      partnerEmail: 'b@x.com',
      pairingId: 'p1',
    });
    expect(pairingView(p({ status: 'ACTIVE', members: ['u1', 'u2'] }), 'b@x.com')).toEqual({
      kind: 'active',
      partnerEmail: 'a@x.com',
      pairingId: 'p1',
    });
  });
});
