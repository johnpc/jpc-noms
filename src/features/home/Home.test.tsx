import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

const useAuthMock = vi.hoisted(() => vi.fn());
vi.mock('../auth/useAuth', () => ({ useAuth: useAuthMock }));

import { Home } from './Home';

const renderHome = () =>
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );

describe('Home', () => {
  it('always offers restaurant search', () => {
    useAuthMock.mockReturnValue({ status: 'unauthenticated' });
    renderHome();
    expect(screen.getByTestId('home-search')).toHaveAttribute('href', '/search');
  });

  it('prompts sign-in when signed out', () => {
    useAuthMock.mockReturnValue({ status: 'unauthenticated' });
    renderHome();
    expect(screen.getByTestId('home-signin')).toHaveAttribute('href', '/signin');
    expect(screen.queryByTestId('home-noms')).not.toBeInTheDocument();
  });

  it('links to rotation and shared noms when signed in', () => {
    useAuthMock.mockReturnValue({ status: 'authenticated' });
    renderHome();
    expect(screen.getByTestId('home-rotation')).toHaveAttribute('href', '/rotation');
    expect(screen.getByTestId('home-partner')).toHaveAttribute('href', '/partner');
    expect(screen.getByTestId('home-noms')).toHaveAttribute('href', '/noms');
    expect(screen.queryByTestId('home-signin')).not.toBeInTheDocument();
  });

  it('always links to settings', () => {
    useAuthMock.mockReturnValue({ status: 'unauthenticated' });
    renderHome();
    expect(screen.getByTestId('home-settings')).toHaveAttribute('href', '/settings');
  });
});
