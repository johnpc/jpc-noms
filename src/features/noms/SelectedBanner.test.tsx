import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Nom } from './types';

const usePlaceMock = vi.hoisted(() => vi.fn());
vi.mock('../search/searchApi', () => ({ usePlace: usePlaceMock }));

import { SelectedBanner } from './SelectedBanner';

const nom: Nom = {
  id: 'n1',
  pairingId: 'p1',
  members: [],
  optionPlaceIds: ['x'],
  selectedPlaceId: 'x',
  selectedBy: 'Emily',
  status: 'SELECTED',
};

describe('SelectedBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('names the winning restaurant + who picked', () => {
    usePlaceMock.mockReturnValue({
      data: { id: 'x', name: 'places/x', displayName: { text: 'Chela’s' } },
    });
    render(<SelectedBanner nom={nom} />);
    const banner = screen.getByTestId('today-selected');
    expect(banner).toHaveTextContent('Chela’s');
    expect(banner).toHaveTextContent('Emily picked this');
  });

  it('falls back to "Selected" while the place resolves', () => {
    usePlaceMock.mockReturnValue({ data: null });
    render(<SelectedBanner nom={nom} />);
    expect(screen.getByTestId('today-selected')).toHaveTextContent('Selected');
  });
});
