import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dispatchPush, getPushState, subscribePush } from './pushStore';

describe('pushStore', () => {
  beforeEach(() => {
    dispatchPush({ type: 'reset' });
  });

  it('starts idle and applies events through the reducer', () => {
    expect(getPushState()).toEqual({ kind: 'idle' });
    expect(dispatchPush({ type: 'start' })).toEqual({ kind: 'requesting' });
    expect(getPushState()).toEqual({ kind: 'requesting' });
  });

  it('notifies subscribers only when the state changes, and unsubscribes', () => {
    const l = vi.fn();
    const off = subscribePush(l);
    dispatchPush({ type: 'saved' }); // ignored in idle → no change
    expect(l).not.toHaveBeenCalled();
    dispatchPush({ type: 'start' });
    expect(l).toHaveBeenCalledTimes(1);
    off();
    dispatchPush({ type: 'reset' });
    expect(l).toHaveBeenCalledTimes(1);
  });
});
