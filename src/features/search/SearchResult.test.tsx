import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// PlacePhoto hits the image API; stub it so the card stays render-only.
vi.mock('./PlacePhoto', () => ({ PlacePhoto: () => null }));

import { SearchResult } from './SearchResult';
import type { Place } from './types';

const place: Place = { id: 'p1', name: 'places/p1', displayName: { text: 'Joe' } };

describe('SearchResult', () => {
  it('offers "Add to rotation" and ➕ Nom when not yet saved', () => {
    const onAdd = vi.fn();
    const onNom = vi.fn();
    render(
      <SearchResult
        place={place}
        saved={false}
        adding={false}
        addingNom={false}
        onAdd={onAdd}
        onNom={onNom}
      />,
    );
    expect(screen.getByText('Add to rotation')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('place-card-action'));
    expect(onAdd).toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('place-card-nom'));
    expect(onNom).toHaveBeenCalled();
  });

  it('shows the in-rotation state and disables the add action when saved', () => {
    render(
      <SearchResult
        place={place}
        saved
        adding={false}
        addingNom={false}
        onAdd={vi.fn()}
        onNom={vi.fn()}
      />,
    );
    expect(screen.getByText('In rotation ✓')).toBeInTheDocument();
  });
});
