import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const signUp = vi.hoisted(() => vi.fn());
const confirmSignUp = vi.hoisted(() => vi.fn());
const signIn = vi.hoisted(() => vi.fn());
const replace = vi.hoisted(() => vi.fn());
vi.mock('./useAuth', () => ({ useAuth: () => ({ signUp, confirmSignUp, signIn }) }));
vi.mock('react-router-dom', () => ({ useHistory: () => ({ replace }) }));

import { useSignUpForm } from './useSignUpForm';

describe('useSignUpForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signIn.mockResolvedValue(undefined);
  });

  it('moves to the confirm phase when Cognito needs a code', async () => {
    signUp.mockResolvedValue({ needsConfirmation: true });
    const { result } = renderHook(() => useSignUpForm());
    await act(async () => result.current.submitDetails());
    await waitFor(() => expect(result.current.phase).toBe('confirm'));
  });

  it('signs in directly when no confirmation is needed', async () => {
    signUp.mockResolvedValue({ needsConfirmation: false });
    const { result } = renderHook(() => useSignUpForm());
    act(() => {
      result.current.setEmail('a@b.com');
      result.current.setPassword('pw');
    });
    await act(async () => result.current.submitDetails());
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/noms'));
    expect(signIn).toHaveBeenCalledWith('a@b.com', 'pw');
  });

  it('confirms the code then signs in', async () => {
    confirmSignUp.mockResolvedValue(undefined);
    const { result } = renderHook(() => useSignUpForm());
    act(() => result.current.setCode('123456'));
    await act(async () => result.current.submitCode());
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/noms'));
    expect(confirmSignUp).toHaveBeenCalled();
  });

  it('surfaces an error when sign-up fails', async () => {
    signUp.mockRejectedValue(new Error('weak password'));
    const { result } = renderHook(() => useSignUpForm());
    await act(async () => result.current.submitDetails());
    await waitFor(() => expect(result.current.error).toBe('weak password'));
  });

  it('surfaces an error when confirmation fails', async () => {
    confirmSignUp.mockRejectedValue(new Error('bad code'));
    const { result } = renderHook(() => useSignUpForm());
    await act(async () => result.current.submitCode());
    await waitFor(() => expect(result.current.error).toBe('bad code'));
  });

  it('uses generic messages when a non-Error is thrown', async () => {
    signUp.mockRejectedValue('boom');
    confirmSignUp.mockRejectedValue('boom');
    const { result } = renderHook(() => useSignUpForm());
    await act(async () => result.current.submitDetails());
    await waitFor(() => expect(result.current.error).toBe('Sign-up failed.'));
    await act(async () => result.current.submitCode());
    await waitFor(() => expect(result.current.error).toBe('Confirmation failed.'));
  });
});
