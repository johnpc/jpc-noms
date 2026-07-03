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
      <RotationItem googlePlaceId="p1" onRemove={vi.fn()} removing={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the place with a Remove action that fires onRemove', () => {
    usePlaceMock.mockReturnValue({
      data: { id: 'p1', name: 'places/p1', displayName: { text: 'Joe' } },
      isLoading: false,
    });
    const onRemove = vi.fn();
    render(<RotationItem googlePlaceId="p1" onRemove={onRemove} removing={false} />);
    expect(screen.getByText('Joe')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('place-card-action'));
    expect(onRemove).toHaveBeenCalled();
  });
});
