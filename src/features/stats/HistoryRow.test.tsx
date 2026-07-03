import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Nom } from '../noms/types';

const usePlaceMock = vi.hoisted(() => vi.fn());
vi.mock('../search/searchApi', () => ({ usePlace: usePlaceMock }));

import { HistoryRow } from './HistoryRow';

const nom: Nom = {
  id: 'n1',
  pairingId: 'p1',
  members: [],
  title: 'Friday',
  optionPlaceIds: ['x'],
  selectedPlaceId: 'x',
  status: 'SELECTED',
};

describe('HistoryRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the nom title and the resolved winning restaurant', () => {
    usePlaceMock.mockReturnValue({
      data: { id: 'x', name: 'places/x', displayName: { text: 'Joe' } },
    });
    render(<HistoryRow nom={nom} />);
    expect(screen.getByTestId('history-row')).toHaveTextContent('Friday');
    expect(screen.getByTestId('history-row')).toHaveTextContent('Joe');
  });

  it('shows a placeholder while the place resolves', () => {
    usePlaceMock.mockReturnValue({ data: null });
    render(<HistoryRow nom={nom} />);
    expect(screen.getByTestId('history-row')).toHaveTextContent('…');
  });
});
