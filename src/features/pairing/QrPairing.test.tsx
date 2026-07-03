import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({ scan: vi.fn(), state: {} as Record<string, unknown> }));
vi.mock('./useScanToPair', () => ({ useScanToPair: () => ({ scan: h.scan, ...h.state }) }));
vi.mock('./QrCode', () => ({ QrCode: ({ value }: { value: string }) => <div>qr:{value}</div> }));

import { QrPairing } from './QrPairing';

describe('QrPairing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.state = { myCode: 'noms:pair:abc', pairing: false, error: null };
  });

  it('shows my QR and a scan button', () => {
    render(<QrPairing />);
    expect(screen.getByText('qr:noms:pair:abc')).toBeInTheDocument();
    expect(screen.getByTestId('qr-scan-btn')).toBeInTheDocument();
  });

  it('scans on tap', () => {
    render(<QrPairing />);
    fireEvent.click(screen.getByTestId('qr-scan-btn'));
    expect(h.scan).toHaveBeenCalled();
  });

  it('shows an error when pairing fails', () => {
    h.state = { myCode: 'x', pairing: false, error: 'nope' };
    render(<QrPairing />);
    expect(screen.getByTestId('qr-error')).toHaveTextContent('nope');
  });
});
