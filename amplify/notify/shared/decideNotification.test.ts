import { describe, it, expect } from 'vitest';
import { decideNotification, type NomImage } from './decideNotification';

const img = (over: Partial<NomImage>): NomImage => ({
  members: ['u1', 'u2'],
  optionPlaceIds: [],
  ...over,
});

describe('decideNotification', () => {
  it('notifies the other member when an option is added', () => {
    const out = decideNotification(
      'MODIFY',
      img({ optionPlaceIds: ['a'], lastActorSub: 'u1', lastActionText: 'John', title: 'Fri' }),
      img({ optionPlaceIds: [] }),
    );
    expect(out).toEqual({ recipientSubs: ['u2'], title: 'Noms', body: 'John added a spot to Fri' });
  });

  it('notifies when a nom becomes selected', () => {
    const out = decideNotification(
      'MODIFY',
      img({ status: 'SELECTED', selectedPlaceId: 'a', lastActorSub: 'u2', title: 'Dinner' }),
      img({ status: 'OPEN' }),
    );
    expect(out?.recipientSubs).toEqual(['u1']);
    expect(out?.body).toContain('picked where to eat for Dinner');
  });

  it('does not notify the actor themselves', () => {
    const out = decideNotification(
      'MODIFY',
      img({ members: ['u1'], optionPlaceIds: ['a'], lastActorSub: 'u1' }),
      img({ members: ['u1'], optionPlaceIds: [] }),
    );
    expect(out).toBeNull();
  });

  it('is null when nothing noteworthy changed', () => {
    const out = decideNotification(
      'MODIFY',
      img({ optionPlaceIds: ['a'] }),
      img({ optionPlaceIds: ['a'] }),
    );
    expect(out).toBeNull();
  });

  it('is null for a REMOVE event or missing new image', () => {
    expect(decideNotification('REMOVE', undefined, img({}))).toBeNull();
    expect(decideNotification('MODIFY', undefined, undefined)).toBeNull();
  });

  it('re-selecting an already-selected nom does not re-notify', () => {
    const out = decideNotification(
      'MODIFY',
      img({ status: 'SELECTED', selectedPlaceId: 'b', lastActorSub: 'u2' }),
      img({ status: 'SELECTED', selectedPlaceId: 'a' }),
    );
    expect(out).toBeNull();
  });
});
