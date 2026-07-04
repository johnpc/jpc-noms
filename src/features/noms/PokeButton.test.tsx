import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({ usePoke: vi.fn() }));
vi.mock('./usePoke', () => ({ usePoke: h.usePoke }));

import { PokeButton } from './PokeButton';

describe('PokeButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when not paired', () => {
    h.usePoke.mockReturnValue({ canPoke: false, poke: vi.fn(), poking: false });
    const { container } = render(<PokeButton />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders + fires poke when paired', () => {
    const poke = vi.fn();
    h.usePoke.mockReturnValue({ canPoke: true, poke, poking: false });
    render(<PokeButton />);
    fireEvent.click(screen.getByTestId('poke-btn'));
    expect(poke).toHaveBeenCalled();
  });
});
