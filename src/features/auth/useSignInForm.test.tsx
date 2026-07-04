import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const signIn = vi.hoisted(() => vi.fn());
const replace = vi.hoisted(() => vi.fn());
vi.mock('./useAuth', () => ({ useAuth: () => ({ signIn }) }));
vi.mock('react-router-dom', () => ({ useHistory: () => ({ replace }) }));

import { useSignInForm } from './useSignInForm';

describe('useSignInForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('signs in and routes to noms on success', async () => {
    signIn.mockResolvedValue(undefined);
    const { result } = renderHook(() => useSignInForm());
    act(() => {
      result.current.setEmail('a@b.com');
      result.current.setPassword('pw');
    });
    await act(async () => result.current.submit());
    expect(signIn).toHaveBeenCalledWith('a@b.com', 'pw');
    expect(replace).toHaveBeenCalledWith('/home');
  });

  it('surfaces an error message on failure', async () => {
    signIn.mockRejectedValue(new Error('bad creds'));
    const { result } = renderHook(() => useSignInForm());
    await act(async () => result.current.submit());
    await waitFor(() => expect(result.current.error).toBe('bad creds'));
    expect(replace).not.toHaveBeenCalled();
  });

  it('uses a generic message when a non-Error is thrown', async () => {
    signIn.mockRejectedValue('boom');
    const { result } = renderHook(() => useSignInForm());
    await act(async () => result.current.submit());
    await waitFor(() => expect(result.current.error).toBe('Sign-in failed.'));
  });
});
