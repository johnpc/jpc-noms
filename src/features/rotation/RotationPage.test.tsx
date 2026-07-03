import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useRotation: vi.fn(),
  remove: vi.fn(),
  addToNom: vi.fn(),
}));
vi.mock('../auth/useAuth', () => ({ useAuth: h.useAuth }));
vi.mock('./rotationApi', () => ({
  useRotation: h.useRotation,
  useRemoveFromRotation: () => ({ mutate: h.remove, isPending: false }),
}));
vi.mock('../noms/useAddToNom', () => ({
  useAddToNom: () => ({ addToNom: h.addToNom, busy: false }),
}));
vi.mock('./RotationItem', () => ({
  RotationItem: ({ googlePlaceId }: { googlePlaceId: string }) => <div>item:{googlePlaceId}</div>,
}));

import { RotationPage } from './RotationPage';

describe('RotationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prompts sign-in when signed out', () => {
    h.useAuth.mockReturnValue({ status: 'unauthenticated' });
    h.useRotation.mockReturnValue({ data: [], isLoading: false });
    render(<RotationPage />);
    expect(screen.getByTestId('rotation-signin')).toBeInTheDocument();
  });

  it('shows an empty state when signed in with no favorites', () => {
    h.useAuth.mockReturnValue({ status: 'authenticated' });
    h.useRotation.mockReturnValue({ data: [], isLoading: false });
    render(<RotationPage />);
    expect(screen.getByTestId('rotation-empty')).toBeInTheDocument();
  });

  it('renders an item per saved favorite', () => {
    h.useAuth.mockReturnValue({ status: 'authenticated' });
    h.useRotation.mockReturnValue({
      data: [
        { id: 'r1', googlePlaceId: 'p1' },
        { id: 'r2', googlePlaceId: 'p2' },
      ],
      isLoading: false,
    });
    render(<RotationPage />);
    expect(screen.getByText('item:p1')).toBeInTheDocument();
    expect(screen.getByText('item:p2')).toBeInTheDocument();
  });
});
