import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const usePlaceMock = vi.hoisted(() => vi.fn());
vi.mock('../search/searchApi', () => ({
  usePlace: usePlaceMock,
  usePlaceImage: () => ({ data: null }),
}));

import { RotationItem } from './RotationItem';

describe('RotationItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing while the place is loading', () => {
    usePlaceMock.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(
      <RotationItem
        googlePlaceId="p1"
        onRemove={vi.fn()}
        removing={false}
        onNom={vi.fn()}
        addingNom={false}
        nominated={false}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the place with Remove + ➕ Nom actions that fire their handlers', () => {
    usePlaceMock.mockReturnValue({
      data: { id: 'p1', name: 'places/p1', displayName: { text: 'Joe' } },
      isLoading: false,
    });
    const onRemove = vi.fn();
    const onNom = vi.fn();
    render(
      <RotationItem
        googlePlaceId="p1"
        onRemove={onRemove}
        removing={false}
        onNom={onNom}
        addingNom={false}
        nominated={false}
      />,
    );
    expect(screen.getByText('Joe')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('place-card-action'));
    expect(onRemove).toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('place-card-nom'));
    expect(onNom).toHaveBeenCalled();
  });
});
