import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NomFooterActions } from './NomFooterActions';

const base = {
  busy: false,
  onDecide: vi.fn(),
  onReopen: vi.fn(),
  onDelete: vi.fn(),
};

describe('NomFooterActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('offers Decide-for-us when open with options', () => {
    render(<NomFooterActions selected={false} hasOptions {...base} />);
    expect(screen.getByTestId('nom-decide-btn')).toBeInTheDocument();
    expect(screen.queryByTestId('nom-reopen-btn')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('nom-decide-btn'));
    expect(base.onDecide).toHaveBeenCalled();
  });

  it('hides Decide-for-us when there are no options', () => {
    render(<NomFooterActions selected={false} hasOptions={false} {...base} />);
    expect(screen.queryByTestId('nom-decide-btn')).not.toBeInTheDocument();
  });

  it('offers Re-open once selected', () => {
    render(<NomFooterActions selected hasOptions {...base} />);
    expect(screen.getByTestId('nom-reopen-btn')).toBeInTheDocument();
    expect(screen.queryByTestId('nom-decide-btn')).not.toBeInTheDocument();
  });

  it('always offers delete', () => {
    render(<NomFooterActions selected={false} hasOptions={false} {...base} />);
    fireEvent.click(screen.getByTestId('nom-delete-btn'));
    expect(base.onDelete).toHaveBeenCalled();
  });
});
