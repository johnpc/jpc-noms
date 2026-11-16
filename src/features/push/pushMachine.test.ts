import { describe, it, expect } from 'vitest';
import {
  PUSH_IDLE,
  isPushWorking,
  pushFailure,
  pushReduce,
  type PushRegistration,
} from './pushMachine';

const run = (events: Parameters<typeof pushReduce>[1][], from: PushRegistration = PUSH_IDLE) =>
  events.reduce(pushReduce, from);

describe('pushReduce', () => {
  it('walks the happy path: start → permission → token → saved', () => {
    expect(run([{ type: 'start' }])).toEqual({ kind: 'requesting' });
    expect(run([{ type: 'start' }, { type: 'permission', receive: 'granted' }])).toEqual({
      kind: 'awaiting-token',
    });
    const saving = run([
      { type: 'start' },
      { type: 'permission', receive: 'granted' },
      { type: 'token', token: 't1' },
    ]);
    expect(saving).toEqual({ kind: 'saving', token: 't1' });
    expect(isPushWorking(saving)).toBe(true);
    expect(pushReduce(saving, { type: 'saved' })).toEqual({ kind: 'registered', token: 't1' });
  });

  it('fails on a refused permission, remembering denied vs prompt', () => {
    const denied = run([{ type: 'start' }, { type: 'permission', receive: 'denied' }]);
    expect(denied).toMatchObject({ kind: 'failed', permission: 'denied' });
    expect(pushFailure(denied)).toContain('denied');
    expect(run([{ type: 'start' }, { type: 'permission', receive: 'prompt' }])).toMatchObject({
      permission: 'prompt',
    });
  });

  it('an APNs or save error fails from any state', () => {
    expect(pushReduce({ kind: 'awaiting-token' }, { type: 'error', reason: 'aps' })).toEqual({
      kind: 'failed',
      reason: 'aps',
      permission: 'granted',
    });
  });

  it('ignores out-of-order events and does not restart while working', () => {
    expect(pushReduce(PUSH_IDLE, { type: 'token', token: 'x' })).toEqual(PUSH_IDLE);
    expect(pushReduce(PUSH_IDLE, { type: 'saved' })).toEqual(PUSH_IDLE);
    expect(pushReduce(PUSH_IDLE, { type: 'permission', receive: 'granted' })).toEqual(PUSH_IDLE);
    expect(pushReduce({ kind: 'awaiting-token' }, { type: 'start' })).toEqual({
      kind: 'awaiting-token',
    });
    // A finished flow can be restarted (manual "Register this device").
    expect(pushReduce({ kind: 'registered', token: 't' }, { type: 'start' })).toEqual({
      kind: 'requesting',
    });
  });

  it('reset returns to idle; helpers read idle as not working / no failure', () => {
    expect(pushReduce({ kind: 'registered', token: 't' }, { type: 'reset' })).toEqual(PUSH_IDLE);
    expect(isPushWorking(PUSH_IDLE)).toBe(false);
    expect(pushFailure(PUSH_IDLE)).toBe('');
  });
});
