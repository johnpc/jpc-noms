import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

const useAuthMock = vi.hoisted(() => vi.fn());
const isNativeMock = vi.hoisted(() => vi.fn(() => false));
vi.mock('../auth/useAuth', () => ({ useAuth: useAuthMock }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: isNativeMock } }));

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
    expect(screen.getByTestId('home-stats')).toHaveAttribute('href', '/stats');
    expect(screen.queryByTestId('home-signin')).not.toBeInTheDocument();
  });

  it('links to settings always and to download on the web build', () => {
    isNativeMock.mockReturnValue(false);
    useAuthMock.mockReturnValue({ status: 'unauthenticated' });
    renderHome();
    expect(screen.getByTestId('home-settings')).toHaveAttribute('href', '/settings');
    expect(screen.getByTestId('home-download')).toHaveAttribute('href', '/download');
  });

  it('hides the download link on the native app', () => {
    isNativeMock.mockReturnValue(true);
    useAuthMock.mockReturnValue({ status: 'unauthenticated' });
    renderHome();
    expect(screen.getByTestId('home-settings')).toHaveAttribute('href', '/settings');
    expect(screen.queryByTestId('home-download')).not.toBeInTheDocument();
    isNativeMock.mockReturnValue(false);
  });
});
