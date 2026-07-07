import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// PlacePhoto hits the image API; stub it so PlaceCard tests stay render-only.
vi.mock('./PlacePhoto', () => ({ PlacePhoto: () => null }));

import { PlaceCard } from './PlaceCard';
import type { Place } from './types';

const place: Place = {
  id: 'p1',
  name: 'places/p1',
  displayName: { text: "Joe's Pizza" },
  priceLevel: 'PRICE_LEVEL_MODERATE',
  editorialSummary: { text: 'Cozy slice shop' },
};

describe('PlaceCard', () => {
  it('renders name, price, and blurb', () => {
    render(<PlaceCard place={place} />);
    expect(screen.getByText("Joe's Pizza")).toBeInTheDocument();
    expect(screen.getByText('$$')).toBeInTheDocument();
    expect(screen.getByText('Cozy slice shop')).toBeInTheDocument();
  });

  it('renders no action button without an actionLabel', () => {
    render(<PlaceCard place={place} />);
    expect(screen.queryByTestId('place-card-action')).not.toBeInTheDocument();
  });

  it('links to the website when present, else a Maps fallback', () => {
    const { rerender } = render(<PlaceCard place={{ ...place, websiteUri: 'https://joes.x' }} />);
    const link = screen.getByTestId('place-card-website');
    expect(link).toHaveAttribute('href', 'https://joes.x');
    expect(link).toHaveAttribute('aria-label', 'Website');
    rerender(<PlaceCard place={place} />);
    expect(screen.getByTestId('place-card-website')).toHaveAttribute('aria-label', 'View on Maps');
  });

  it('fires onAction when the action is tapped', () => {
    const onAction = vi.fn();
    render(<PlaceCard place={place} actionLabel="Add to rotation" onAction={onAction} />);
    fireEvent.click(screen.getByTestId('place-card-action'));
    expect(onAction).toHaveBeenCalled();
  });

  it('colors the action red when actionDanger is set', () => {
    const { rerender } = render(
      <PlaceCard place={place} actionLabel="Add to rotation" onAction={vi.fn()} />,
    );
    expect(screen.getByTestId('place-card-action')).not.toHaveAttribute('color', 'danger');
    rerender(<PlaceCard place={place} actionLabel="Remove" onAction={vi.fn()} actionDanger />);
    expect(screen.getByTestId('place-card-action')).toHaveAttribute('color', 'danger');
  });

  it('renders a ➕ Nom button only when onNom is provided, and fires it', () => {
    const { rerender } = render(<PlaceCard place={place} />);
    expect(screen.queryByTestId('place-card-nom')).not.toBeInTheDocument();
    const onNom = vi.fn();
    rerender(<PlaceCard place={place} onNom={onNom} />);
    fireEvent.click(screen.getByTestId('place-card-nom'));
    expect(onNom).toHaveBeenCalled();
  });
});
