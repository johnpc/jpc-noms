import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Nom } from '../noms/types';

const usePlaceMock = vi.hoisted(() => vi.fn());
vi.mock('../search/searchApi', () => ({ usePlace: usePlaceMock }));

import { HistoryRow } from './HistoryRow';

const nom: Nom = {
  id: 'n1',
  pairingId: 'p1',
  members: [],
  createdAt: '2026-07-03T12:00:00.000Z',
  optionPlaceIds: ['x', 'y', 'z'],
  selectedPlaceId: 'x',
  status: 'SELECTED',
};

const renderRow = (n: Nom = nom) =>
  render(
    <MemoryRouter>
      <HistoryRow nom={n} />
    </MemoryRouter>,
  );

describe('HistoryRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePlaceMock.mockReturnValue({
      data: { id: 'x', name: 'places/x', displayName: { text: 'Joe' } },
    });
  });

  it('shows the date (title) + winning restaurant (subtitle) in a tappable row', () => {
    renderRow();
    const row = screen.getByTestId('history-row');
    expect(row).toHaveTextContent('Jul');
    expect(row).toHaveTextContent('Joe');
  });

  it('shows a +N badge and expands to the other options', () => {
    renderRow();
    // 3 options, 1 selected → 2 others
    expect(screen.getByTestId('history-row')).toHaveTextContent('+2');
    expect(screen.queryByTestId('history-others')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('history-expand'));
    expect(screen.getByTestId('history-others')).toBeInTheDocument();
  });

  it('has no expander when there were no other options', () => {
    renderRow({ ...nom, optionPlaceIds: ['x'] });
    expect(screen.queryByTestId('history-expand')).not.toBeInTheDocument();
  });

  it('shows a placeholder while the winner resolves', () => {
    usePlaceMock.mockReturnValue({ data: null });
    renderRow();
    expect(screen.getByTestId('history-row')).toHaveTextContent('…');
  });
});
