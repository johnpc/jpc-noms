import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const client = vi.hoisted(() => ({
  currentEmail: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  confirmSignUp: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock('./authClient', () => client);

import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';

function Probe() {
  const a = useAuth();
  return (
    <div>
      <span data-testid="status">{a.status}</span>
      <span data-testid="email">{a.email ?? 'none'}</span>
      <button onClick={() => a.signIn('a@b.com', 'pw')}>signin</button>
      <button onClick={() => a.signUp('a@b.com', 'pw')}>signup</button>
      <button onClick={() => a.confirmSignUp('a@b.com', '123456')}>confirm</button>
      <button onClick={() => a.signOut()}>signout</button>
    </div>
  );
}

const renderProbe = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves to unauthenticated when no session', async () => {
    client.currentEmail.mockResolvedValue(null);
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
  });

  it('resolves to authenticated and exposes the email', async () => {
    client.currentEmail.mockResolvedValue('a@b.com');
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
    expect(screen.getByTestId('email')).toHaveTextContent('a@b.com');
  });

  it('signIn refreshes session state', async () => {
    client.currentEmail.mockResolvedValueOnce(null).mockResolvedValue('a@b.com');
    client.signIn.mockResolvedValue(undefined);
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
    await act(async () => void screen.getByText('signin').click());
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
  });

  it('signOut clears the session', async () => {
    client.currentEmail.mockResolvedValue('a@b.com');
    client.signOut.mockResolvedValue(undefined);
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
    await act(async () => void screen.getByText('signout').click());
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
  });

  it('exposes signUp and confirmSignUp passthroughs', async () => {
    client.currentEmail.mockResolvedValue(null);
    client.signUp.mockResolvedValue({ needsConfirmation: true });
    client.confirmSignUp.mockResolvedValue(undefined);
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
    await act(async () => void screen.getByText('signup').click());
    await act(async () => void screen.getByText('confirm').click());
    expect(client.signUp).toHaveBeenCalledWith('a@b.com', 'pw');
    expect(client.confirmSignUp).toHaveBeenCalledWith('a@b.com', '123456');
  });
});

describe('useAuth', () => {
  it('throws outside a provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/within an AuthProvider/);
    spy.mockRestore();
  });
});
