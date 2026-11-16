import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const useSearchMock = vi.hoisted(() => vi.fn());
vi.mock('./useSearch', () => ({ useSearch: useSearchMock }));
// PlaceCard renders PlacePhoto (hits the image API); stub it out here.
vi.mock('./PlacePhoto', () => ({ PlacePhoto: () => null }));

import { SearchPage } from './SearchPage';

const base = {
  term: 'pizza',
  setTerm: vi.fn(),
  suggestions: ['Pizza', 'Sushi'] as const,
  results: {
    kind: 'ready',
    places: [
      { id: 'p1', name: 'places/p1', displayName: { text: 'Joe' } },
      { id: 'p2', name: 'places/p2', displayName: { text: 'Ann' } },
    ],
  },
  retry: vi.fn(),
  savedIds: new Set<string>(['p1']),
  add: vi.fn(),
  adding: false,
  addNom: vi.fn(),
  addingNom: false,
  nominatedIds: new Set<string>(),
};

describe('SearchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a card per result', () => {
    useSearchMock.mockReturnValue(base);
    render(<SearchPage />);
    expect(screen.getAllByTestId('place-card')).toHaveLength(2);
  });

  it('marks already-saved places as in rotation', () => {
    useSearchMock.mockReturnValue(base);
    render(<SearchPage />);
    expect(screen.getByText('In rotation ✓')).toBeInTheDocument();
    expect(screen.getByText('Add to rotation')).toBeInTheDocument();
  });

  it('shows an empty message when a search returns nothing', () => {
    useSearchMock.mockReturnValue({ ...base, results: { kind: 'empty' } });
    render(<SearchPage />);
    expect(screen.getByText(/No restaurants found/)).toBeInTheDocument();
  });

  it('shows a spinner while loading', () => {
    useSearchMock.mockReturnValue({ ...base, results: { kind: 'loading' } });
    render(<SearchPage />);
    expect(screen.getByTestId('search-spinner')).toBeInTheDocument();
  });

  it('shows the failure + a retry button when the search errors', () => {
    useSearchMock.mockReturnValue({ ...base, results: { kind: 'error', message: 'Nope' } });
    render(<SearchPage />);
    expect(screen.getByTestId('search-error')).toHaveTextContent('Nope');
    screen.getByTestId('search-retry').click();
    expect(base.retry).toHaveBeenCalled();
  });
});
