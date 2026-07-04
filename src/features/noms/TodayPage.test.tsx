import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Nom } from './types';

const useToday = vi.hoisted(() => vi.fn());
vi.mock('./useToday', () => ({ useToday: useToday }));
vi.mock('./NomFooterActions', () => ({ NomFooterActions: () => <div data-testid="nom-footer" /> }));
vi.mock('./NomOptionsSection', () => ({
  NomOptionsSection: () => <div data-testid="nom-options" />,
}));
vi.mock('./PokeButton', () => ({ PokeButton: () => <div data-testid="poke-btn" /> }));
vi.mock('./PreviousPick', () => ({
  PreviousPick: () => <div data-testid="today-previous">prev</div>,
}));

import { TodayPage } from './TodayPage';

const nom: Nom = {
  id: 'n1',
  pairingId: 'p1',
  members: ['u1', 'u2'],
  createdAt: '2026-07-03T09:00:00',
  optionPlaceIds: ['a'],
  status: 'OPEN',
};
const base = {
  signedIn: true,
  loading: false,
  nom,
  previous: undefined,
  addable: ['b'],
  add: vi.fn(),
  select: vi.fn(),
  remove: vi.fn(),
  reopen: vi.fn(),
  decideForUs: vi.fn(),
  del: vi.fn(),
  busy: false,
};
const renderPage = () =>
  render(
    <MemoryRouter>
      <TodayPage />
    </MemoryRouter>,
  );

describe('TodayPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prompts sign-in when signed out', () => {
    useToday.mockReturnValue({ ...base, signedIn: false, nom: undefined });
    renderPage();
    expect(screen.getByTestId('today-signin')).toBeInTheDocument();
  });

  it('shows the empty state + find link when no nom today', () => {
    useToday.mockReturnValue({ ...base, nom: undefined });
    renderPage();
    expect(screen.getByTestId('today-empty')).toBeInTheDocument();
    expect(screen.getByTestId('today-find')).toBeInTheDocument();
  });

  it('renders the options section when today has a nom with options', () => {
    useToday.mockReturnValue(base);
    renderPage();
    expect(screen.getByTestId('nom-options')).toBeInTheDocument();
    expect(screen.queryByTestId('today-empty')).not.toBeInTheDocument();
  });

  it('shows the previous pick for reference when present', () => {
    useToday.mockReturnValue({ ...base, previous: { ...nom, id: 'old' } });
    renderPage();
    expect(screen.getByTestId('today-previous')).toBeInTheDocument();
  });

  it('shows the selected banner once decided', () => {
    useToday.mockReturnValue({
      ...base,
      nom: { ...nom, status: 'SELECTED', selectedPlaceId: 'a' },
    });
    renderPage();
    expect(screen.getByTestId('today-selected')).toBeInTheDocument();
  });
});
