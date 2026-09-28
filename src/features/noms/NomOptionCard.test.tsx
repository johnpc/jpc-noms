import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const usePlaceMock = vi.hoisted(() => vi.fn());
vi.mock('../search/searchApi', () => ({
  usePlace: usePlaceMock,
  usePlaceImage: () => ({ data: null }),
}));

import { NomOptionCard } from './NomOptionCard';

describe('NomOptionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing while loading', () => {
    usePlaceMock.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(
      <NomOptionCard googlePlaceId="a" actionLabel="Select" onAction={vi.fn()} disabled={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the place and fires the action', () => {
    usePlaceMock.mockReturnValue({
      data: { id: 'a', name: 'places/a', displayName: { text: 'Joe' } },
      isLoading: false,
    });
    const onAction = vi.fn();
    render(
      <NomOptionCard googlePlaceId="a" actionLabel="Select" onAction={onAction} disabled={false} />,
    );
    expect(screen.getByText('Joe')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('place-card-action'));
    expect(onAction).toHaveBeenCalled();
  });

  it('collapses to a name-only mini row and expands to the full card (with hours) on tap', () => {
    usePlaceMock.mockReturnValue({
      data: {
        id: 'a',
        name: 'places/a',
        displayName: { text: 'Joe' },
        regularOpeningHours: {
          weekdayDescriptions: Array.from({ length: 7 }, () => 'Day: 11:00 AM – 9:00 PM'),
        },
      },
      isLoading: false,
    });
    render(
      <NomOptionCard
        googlePlaceId="a"
        actionLabel="Select"
        onAction={vi.fn()}
        disabled={false}
        collapsible
      />,
    );
    // Collapsed: name only — no hours, no full card / action yet.
    expect(screen.getByTestId('nom-option')).toHaveTextContent('Joe');
    expect(screen.queryByTestId('place-card-hours')).not.toBeInTheDocument();
    expect(screen.queryByTestId('place-card-action')).not.toBeInTheDocument();
    // Tap the row to expand: the full card shows the action and today's hours.
    fireEvent.click(screen.getByTestId('nom-option'));
    expect(screen.getByTestId('place-card-action')).toBeInTheDocument();
    expect(screen.getByTestId('place-card-hours')).toHaveTextContent('Today: 11:00 AM – 9:00 PM');
    // Tap the header to collapse again.
    fireEvent.click(screen.getByTestId('nom-option-collapse'));
    expect(screen.queryByTestId('place-card-action')).not.toBeInTheDocument();
  });
});
