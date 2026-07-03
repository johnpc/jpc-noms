import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Nom } from '../noms/types';

const useStatsMock = vi.hoisted(() => vi.fn());
vi.mock('./useStats', () => ({ useStats: useStatsMock }));
vi.mock('./HistoryRow', () => ({
  HistoryRow: ({ nom }: { nom: Nom }) => <div>row:{nom.id}</div>,
}));

import { StatsPage } from './StatsPage';

const decided = (id: string): Nom => ({
  id,
  pairingId: 'p',
  members: [],
  optionPlaceIds: ['x'],
  selectedPlaceId: 'x',
  status: 'SELECTED',
});

describe('StatsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prompts sign-in when signed out', () => {
    useStatsMock.mockReturnValue({ signedIn: false, loading: false, stats: empty() });
    render(<StatsPage />);
    expect(screen.getByTestId('stats-signin')).toBeInTheDocument();
  });

  it('shows an empty state with no decisions', () => {
    useStatsMock.mockReturnValue({ signedIn: true, loading: false, stats: empty() });
    render(<StatsPage />);
    expect(screen.getByTestId('stats-empty')).toBeInTheDocument();
  });

  it('renders tiles + a history row per decided nom', () => {
    useStatsMock.mockReturnValue({
      signedIn: true,
      loading: false,
      stats: { totalNoms: 2, decidedCount: 2, openCount: 0, history: [decided('a'), decided('b')] },
    });
    render(<StatsPage />);
    expect(screen.getByTestId('stats-tiles')).toBeInTheDocument();
    expect(screen.getByText('row:a')).toBeInTheDocument();
    expect(screen.getByText('row:b')).toBeInTheDocument();
  });
});

function empty() {
  return { totalNoms: 0, decidedCount: 0, openCount: 0, history: [] };
}
