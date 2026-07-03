import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SearchSuggestions } from './SearchSuggestions';

describe('SearchSuggestions', () => {
  it('renders a chip per suggestion and runs a search on tap', () => {
    const onPick = vi.fn();
    render(<SearchSuggestions suggestions={['Pizza', 'Sushi']} onPick={onPick} />);
    expect(screen.getByTestId('suggestion-Pizza')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('suggestion-Sushi'));
    expect(onPick).toHaveBeenCalledWith('Sushi');
  });
});
