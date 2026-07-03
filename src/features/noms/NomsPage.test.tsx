import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const useList = vi.hoisted(() => vi.fn());
vi.mock('./useNoms', () => ({ useNomsList: useList }));

import { NomsPage } from './NomsPage';

const base = {
  signedIn: true,
  paired: true,
  noms: [],
  loading: false,
  createNom: vi.fn(),
  creating: false,
};
const render1 = () =>
  render(
    <MemoryRouter>
      <NomsPage />
    </MemoryRouter>,
  );

describe('NomsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prompts sign-in when signed out', () => {
    useList.mockReturnValue({ ...base, signedIn: false });
    render1();
    expect(screen.getByTestId('noms-signin')).toBeInTheDocument();
  });

  it('lets an unpaired user create a nom (form shown) with a pairing hint', () => {
    useList.mockReturnValue({ ...base, paired: false });
    render1();
    // The create form is available even when unpaired...
    expect(screen.getByTestId('noms-create-btn')).toBeInTheDocument();
    // ...alongside a nudge to pair so noms are shared.
    expect(screen.getByTestId('noms-unpaired')).toBeInTheDocument();
  });

  it('shows an empty state and lists noms', () => {
    useList.mockReturnValue({ ...base, noms: [] });
    const { rerender } = render1();
    expect(screen.getByTestId('noms-empty')).toBeInTheDocument();
    useList.mockReturnValue({
      ...base,
      noms: [
        {
          id: 'n1',
          title: 'Friday',
          optionPlaceIds: [],
          members: [],
          pairingId: 'p1',
          status: 'OPEN',
        },
      ],
    });
    rerender(
      <MemoryRouter>
        <NomsPage />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('nom-row')).toBeInTheDocument();
    expect(screen.getByTestId('nom-row')).toHaveTextContent('Friday');
  });

  it('renders the create control when paired', () => {
    useList.mockReturnValue(base);
    render1();
    expect(screen.getByTestId('noms-create-btn')).toBeInTheDocument();
    expect(screen.getByTestId('noms-title')).toBeInTheDocument();
  });
});
