import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Nom } from './types';

const useDetail = vi.hoisted(() => vi.fn());
vi.mock('./useNomDetail', () => ({ useNomDetail: useDetail }));
vi.mock('react-router-dom', () => ({ useParams: () => ({ id: 'n1' }) }));
vi.mock('./NomOptionCard', () => ({
  NomOptionCard: ({
    googlePlaceId,
    actionLabel,
  }: {
    googlePlaceId: string;
    actionLabel: string;
  }) => (
    <div>
      opt:{googlePlaceId}:{actionLabel}
    </div>
  ),
}));

import { NomDetail } from './NomDetail';

const nom: Nom = {
  id: 'n1',
  pairingId: 'p1',
  members: ['u1', 'u2'],
  title: 'Friday',
  optionPlaceIds: ['a'],
  status: 'OPEN',
};
const base = {
  signedIn: true,
  loading: false,
  nom,
  addable: ['b'],
  add: vi.fn(),
  adding: false,
  select: vi.fn(),
  selecting: false,
};

describe('NomDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders options and addable rotation places', () => {
    useDetail.mockReturnValue(base);
    render(<NomDetail />);
    expect(screen.getByText('opt:a:Select')).toBeInTheDocument();
    expect(screen.getByText('opt:b:Add to nom')).toBeInTheDocument();
  });

  it('shows the selected banner and hides addable once selected', () => {
    useDetail.mockReturnValue({
      ...base,
      nom: { ...nom, status: 'SELECTED', selectedPlaceId: 'a' },
    });
    render(<NomDetail />);
    expect(screen.getByTestId('nom-selected')).toBeInTheDocument();
    expect(screen.queryByTestId('nom-addable')).not.toBeInTheDocument();
  });

  it('prompts sign-in when signed out', () => {
    useDetail.mockReturnValue({ ...base, signedIn: false, nom: undefined });
    render(<NomDetail />);
    expect(screen.getByTestId('nom-signin')).toBeInTheDocument();
  });
});
