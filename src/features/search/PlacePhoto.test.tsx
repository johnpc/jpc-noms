import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Place } from './types';

const useImage = vi.hoisted(() => vi.fn());
vi.mock('./searchApi', () => ({ usePlaceImage: useImage }));

import { PlacePhoto } from './PlacePhoto';

const place = (photos?: (string | null)[]): Place => ({
  id: 'p1',
  name: 'places/p1',
  displayName: { text: 'Joe' },
  photos,
});

describe('PlacePhoto', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when the place has no photos', () => {
    useImage.mockReturnValue({ data: null });
    const { container } = render(<PlacePhoto place={place()} />);
    expect(container).toBeEmptyDOMElement();
    // Disabled query: hook is called with undefined photoId.
    expect(useImage).toHaveBeenCalledWith(undefined);
  });

  it('renders nothing while the image is still resolving', () => {
    useImage.mockReturnValue({ data: null });
    const { container } = render(<PlacePhoto place={place(['ph/1'])} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the first photo once resolved', () => {
    useImage.mockReturnValue({ data: 'https://img/1' });
    render(<PlacePhoto place={place([null, 'ph/2'])} />);
    const img = screen.getByTestId('place-card-photo');
    expect(img).toHaveAttribute('src', 'https://img/1');
    expect(useImage).toHaveBeenCalledWith('ph/2');
  });
});
