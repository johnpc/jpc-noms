import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const useAuthMock = vi.hoisted(() => vi.fn());
vi.mock('./useAuth', () => ({ useAuth: useAuthMock }));

import { AuthGate } from './AuthGate';

describe('AuthGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a splash (not the app) while auth is resolving', () => {
    useAuthMock.mockReturnValue({ status: 'loading' });
    render(
      <AuthGate>
        <div data-testid="app">app</div>
      </AuthGate>,
    );
    expect(screen.getByTestId('auth-gate')).toBeInTheDocument();
    expect(screen.queryByTestId('app')).not.toBeInTheDocument();
  });

  it('renders the app once authenticated (no flash)', () => {
    useAuthMock.mockReturnValue({ status: 'authenticated' });
    render(
      <AuthGate>
        <div data-testid="app">app</div>
      </AuthGate>,
    );
    expect(screen.getByTestId('app')).toBeInTheDocument();
    expect(screen.queryByTestId('auth-gate')).not.toBeInTheDocument();
  });

  it('renders the app once unauthenticated resolves', () => {
    useAuthMock.mockReturnValue({ status: 'unauthenticated' });
    render(
      <AuthGate>
        <div data-testid="app">app</div>
      </AuthGate>,
    );
    expect(screen.getByTestId('app')).toBeInTheDocument();
  });
});
