import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { submissionFlags, useSubmission } from './useSubmission';

describe('submissionFlags', () => {
  it('derives busy / error / message from the one state', () => {
    expect(submissionFlags({ kind: 'idle' })).toEqual({ busy: false, error: null, message: null });
    expect(submissionFlags({ kind: 'busy' })).toEqual({ busy: true, error: null, message: null });
    expect(submissionFlags({ kind: 'failed', error: 'x' })).toEqual({
      busy: false,
      error: 'x',
      message: null,
    });
    expect(submissionFlags({ kind: 'done', message: 'ok' })).toEqual({
      busy: false,
      error: null,
      message: 'ok',
    });
  });
});

describe('useSubmission', () => {
  it('starts idle', () => {
    const { result } = renderHook(() => useSubmission());
    expect(result.current.state).toEqual({ kind: 'idle' });
    expect(result.current.busy).toBe(false);
  });

  it('is busy while the action runs, then done with the message', async () => {
    const { result } = renderHook(() => useSubmission());
    let release: () => void = () => {};
    const pending = new Promise<void>((r) => (release = r));
    let ok: boolean | undefined;
    act(() => {
      void result.current
        .run(() => pending, { fallback: 'f', message: 'Saved.' })
        .then((v) => {
          ok = v;
        });
    });
    expect(result.current.state).toEqual({ kind: 'busy' });
    await act(async () => release());
    expect(result.current.state).toEqual({ kind: 'done', message: 'Saved.' });
    expect(result.current.message).toBe('Saved.');
    expect(ok).toBe(true);
  });

  it('a silent success leaves message null', async () => {
    const { result } = renderHook(() => useSubmission());
    await act(async () => {
      await result.current.run(async () => {}, { fallback: 'f' });
    });
    expect(result.current.state).toEqual({ kind: 'done', message: '' });
    expect(result.current.message).toBeNull();
  });

  it('records the thrown Error message on failure and resolves false', async () => {
    const { result } = renderHook(() => useSubmission());
    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.run(
        async () => {
          throw new Error('nope');
        },
        { fallback: 'f' },
      );
    });
    expect(result.current.state).toEqual({ kind: 'failed', error: 'nope' });
    expect(result.current.error).toBe('nope');
    expect(ok).toBe(false);
  });

  it('uses the fallback for a non-Error throw', async () => {
    const { result } = renderHook(() => useSubmission());
    await act(async () => {
      await result.current.run(() => Promise.reject('boom'), { fallback: 'Fallback.' });
    });
    expect(result.current.error).toBe('Fallback.');
  });

  it('a new run clears a previous failure (no stale error beside busy)', async () => {
    const { result } = renderHook(() => useSubmission());
    act(() => result.current.fail('old'));
    expect(result.current.error).toBe('old');
    await act(async () => {
      await result.current.run(async () => {}, { fallback: 'f' });
    });
    expect(result.current.error).toBeNull();
  });
});
