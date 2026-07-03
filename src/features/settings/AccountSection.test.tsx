import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const useAccountMock = vi.hoisted(() => vi.fn());
vi.mock('./useAccount', () => ({ useAccount: useAccountMock }));

import { AccountSection } from './AccountSection';

const base = {
  email: 'a@b.com',
  busy: false,
  error: null,
  message: null,
  changePassword: vi.fn(),
  deleteAccount: vi.fn(),
  signOut: vi.fn(),
};

describe('AccountSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prompts sign-in when signed out', () => {
    useAccountMock.mockReturnValue({ ...base, email: null });
    render(<AccountSection />);
    expect(screen.getByTestId('account-signedout')).toBeInTheDocument();
  });

  it('shows the signed-in email + actions', () => {
    useAccountMock.mockReturnValue(base);
    render(<AccountSection />);
    expect(screen.getByTestId('account-email')).toHaveTextContent('a@b.com');
    expect(screen.getByTestId('account-signout-btn')).toBeInTheDocument();
    expect(screen.getByTestId('account-delete-btn')).toBeInTheDocument();
  });

  it('signs out and deletes via the hook', () => {
    useAccountMock.mockReturnValue(base);
    render(<AccountSection />);
    fireEvent.click(screen.getByTestId('account-signout-btn'));
    expect(base.signOut).toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('account-delete-btn'));
    expect(base.deleteAccount).toHaveBeenCalled();
  });

  it('surfaces an error message', () => {
    useAccountMock.mockReturnValue({ ...base, error: 'nope' });
    render(<AccountSection />);
    expect(screen.getByTestId('account-error')).toHaveTextContent('nope');
  });
});
