import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('qrcode', () => ({
  default: { toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,ZZZ') },
}));

import { QrCode } from './QrCode';

describe('QrCode', () => {
  it('renders the encoded QR image once generated', async () => {
    render(<QrCode value="noms:pair:abc" />);
    await waitFor(() =>
      expect(screen.getByTestId('pairing-qr')).toHaveAttribute('src', 'data:image/png;base64,ZZZ'),
    );
  });

  it('renders nothing for an empty value', () => {
    const { container } = render(<QrCode value="" />);
    expect(container).toBeEmptyDOMElement();
  });
});
