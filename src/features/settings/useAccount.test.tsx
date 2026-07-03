import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  auth: { email: 'a@b.com', signOut: vi.fn(), refresh: vi.fn() },
  replace: vi.fn(),
  changePassword: vi.fn(),
  deleteAccount: vi.fn(),
}));
vi.mock('../auth/useAuth', () => ({ useAuth: () => h.auth }));
vi.mock('react-router-dom', () => ({ useHistory: () => ({ replace: h.replace }) }));
vi.mock('../auth/authClient', () => ({
  changePassword: h.changePassword,
  deleteAccount: h.deleteAccount,
}));

import { useAccount } from './useAccount';

describe('useAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.auth.signOut.mockResolvedValue(undefined);
    h.auth.refresh.mockResolvedValue(undefined);
    h.changePassword.mockResolvedValue(undefined);
    h.deleteAccount.mockResolvedValue(undefined);
  });

  it('changes password and reports success', async () => {
    const { result } = renderHook(() => useAccount());
    await act(async () => result.current.changePassword('old', 'new'));
    expect(h.changePassword).toHaveBeenCalledWith('old', 'new');
    await waitFor(() => expect(result.current.message).toBe('Password updated.'));
  });

  it('surfaces an error when a change fails', async () => {
    h.changePassword.mockRejectedValue(new Error('too weak'));
    const { result } = renderHook(() => useAccount());
    await act(async () => result.current.changePassword('old', 'new'));
    await waitFor(() => expect(result.current.error).toBe('too weak'));
  });

  it('signs out and routes home', async () => {
    const { result } = renderHook(() => useAccount());
    await act(async () => result.current.signOut());
    expect(h.auth.signOut).toHaveBeenCalled();
    expect(h.replace).toHaveBeenCalledWith('/home');
  });

  it('deletes the account and routes home', async () => {
    const { result } = renderHook(() => useAccount());
    await act(async () => result.current.deleteAccount());
    expect(h.deleteAccount).toHaveBeenCalled();
    expect(h.replace).toHaveBeenCalledWith('/home');
  });
});
