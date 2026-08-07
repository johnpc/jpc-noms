import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const resetPassword = vi.hoisted(() => vi.fn());
const confirmResetPassword = vi.hoisted(() => vi.fn());
const signIn = vi.hoisted(() => vi.fn());
const replace = vi.hoisted(() => vi.fn());
vi.mock('./useAuth', () => ({
  useAuth: () => ({ resetPassword, confirmResetPassword, signIn }),
}));
vi.mock('react-router-dom', () => ({ useHistory: () => ({ replace }) }));

import { useResetPasswordForm } from './useResetPasswordForm';

describe('useResetPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends a reset code and advances to the confirm phase', async () => {
    resetPassword.mockResolvedValue(undefined);
    const { result } = renderHook(() => useResetPasswordForm());
    act(() => result.current.setEmail('a@b.com'));
    await act(async () => result.current.submitEmail());
    expect(resetPassword).toHaveBeenCalledWith('a@b.com');
    expect(result.current.phase).toBe('confirm');
  });

  it('surfaces an error and stays in the request phase on send failure', async () => {
    resetPassword.mockRejectedValue(new Error('no such user'));
    const { result } = renderHook(() => useResetPasswordForm());
    await act(async () => result.current.submitEmail());
    await waitFor(() => expect(result.current.error).toBe('no such user'));
    expect(result.current.phase).toBe('request');
  });

  it('confirms the reset, signs in, and routes home', async () => {
    confirmResetPassword.mockResolvedValue(undefined);
    signIn.mockResolvedValue(undefined);
    const { result } = renderHook(() => useResetPasswordForm());
    act(() => {
      result.current.setEmail('a@b.com');
      result.current.setCode('123456');
      result.current.setPassword('newpw');
    });
    await act(async () => result.current.submitReset());
    expect(confirmResetPassword).toHaveBeenCalledWith('a@b.com', '123456', 'newpw');
    expect(signIn).toHaveBeenCalledWith('a@b.com', 'newpw');
    expect(replace).toHaveBeenCalledWith('/home');
  });

  it('surfaces an error when the reset fails', async () => {
    confirmResetPassword.mockRejectedValue(new Error('bad code'));
    const { result } = renderHook(() => useResetPasswordForm());
    await act(async () => result.current.submitReset());
    await waitFor(() => expect(result.current.error).toBe('bad code'));
    expect(replace).not.toHaveBeenCalled();
  });

  it('uses generic messages when a non-Error is thrown', async () => {
    resetPassword.mockRejectedValue('boom');
    const { result } = renderHook(() => useResetPasswordForm());
    await act(async () => result.current.submitEmail());
    await waitFor(() => expect(result.current.error).toBe('Could not send a reset code.'));

    confirmResetPassword.mockRejectedValue('boom');
    await act(async () => result.current.submitReset());
    await waitFor(() => expect(result.current.error).toBe('Could not reset your password.'));
  });
});
