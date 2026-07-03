import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const useFlow = vi.hoisted(() => vi.fn());
vi.mock('./usePairing', () => ({ usePairingFlow: useFlow }));
// QrPairing has its own tests + camera/QR deps; stub it here.
vi.mock('./QrPairing', () => ({ QrPairing: () => <div data-testid="qr-pairing" /> }));

import { PairingPage } from './PairingPage';

const base = {
  signedIn: true,
  loading: false,
  inviteEmail: '',
  setInviteEmail: vi.fn(),
  invite: vi.fn(),
  inviting: false,
  accept: vi.fn(),
  accepting: false,
  unpair: vi.fn(),
  unpairing: false,
};

describe('PairingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prompts sign-in when signed out', () => {
    useFlow.mockReturnValue({ ...base, signedIn: false, view: { kind: 'none' } });
    render(<PairingPage />);
    expect(screen.getByTestId('pairing-signin')).toBeInTheDocument();
  });

  it('shows the invite form when unpaired', () => {
    useFlow.mockReturnValue({ ...base, view: { kind: 'none' } });
    render(<PairingPage />);
    fireEvent.click(screen.getByTestId('pairing-invite-btn'));
    expect(base.invite).toHaveBeenCalled();
  });

  it('shows a waiting message after sending an invite', () => {
    useFlow.mockReturnValue({ ...base, view: { kind: 'pending-sent', partnerEmail: 'b@x.com' } });
    render(<PairingPage />);
    expect(screen.getByTestId('pairing-sent')).toHaveTextContent('b@x.com');
  });

  it('lets the invitee accept', () => {
    useFlow.mockReturnValue({
      ...base,
      view: { kind: 'pending-received', partnerEmail: 'a@x.com', pairingId: 'p1' },
    });
    render(<PairingPage />);
    fireEvent.click(screen.getByTestId('pairing-accept-btn'));
    expect(base.accept).toHaveBeenCalledWith('p1');
  });

  it('shows the partner + an unpair button when active', () => {
    useFlow.mockReturnValue({
      ...base,
      view: { kind: 'active', partnerEmail: 'b@x.com', pairingId: 'p1' },
    });
    render(<PairingPage />);
    expect(screen.getByTestId('pairing-active')).toHaveTextContent('b@x.com');
    fireEvent.click(screen.getByTestId('pairing-unpair-btn'));
    expect(base.unpair).toHaveBeenCalledWith('p1');
  });
});
