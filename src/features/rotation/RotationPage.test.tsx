import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const usePage = vi.hoisted(() => vi.fn());
vi.mock('./useRotationPage', () => ({ useRotationPage: usePage }));
vi.mock('./RotationItem', () => ({
  RotationItem: ({ googlePlaceId }: { googlePlaceId: string }) => <div>item:{googlePlaceId}</div>,
}));

import { RotationPage } from './RotationPage';

const base = {
  remove: vi.fn(),
  removing: false,
  addToNom: vi.fn(),
  addingNom: false,
  nominatedIds: new Set<string>(),
};

describe('RotationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prompts sign-in when signed out', () => {
    usePage.mockReturnValue({ ...base, screen: { kind: 'signed-out' } });
    render(<RotationPage />);
    expect(screen.getByTestId('rotation-signin')).toBeInTheDocument();
  });

  it('shows an empty state when signed in with no favorites', () => {
    usePage.mockReturnValue({ ...base, screen: { kind: 'empty' } });
    render(<RotationPage />);
    expect(screen.getByTestId('rotation-empty')).toBeInTheDocument();
  });

  it('renders nothing but the shell while loading', () => {
    usePage.mockReturnValue({ ...base, screen: { kind: 'loading' } });
    render(<RotationPage />);
    expect(screen.queryByTestId('rotation-empty')).not.toBeInTheDocument();
  });

  it('renders an item per saved favorite', () => {
    usePage.mockReturnValue({
      ...base,
      screen: {
        kind: 'list',
        entries: [
          { id: 'r1', googlePlaceId: 'p1' },
          { id: 'r2', googlePlaceId: 'p2' },
        ],
      },
    });
    render(<RotationPage />);
    expect(screen.getByText('item:p1')).toBeInTheDocument();
    expect(screen.getByText('item:p2')).toBeInTheDocument();
  });
});
