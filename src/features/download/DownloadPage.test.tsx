import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DownloadPage, TESTFLIGHT_URL } from './DownloadPage';

describe('DownloadPage', () => {
  it('links to the TestFlight beta', () => {
    render(<DownloadPage />);
    const link = screen.getByTestId('download-testflight');
    expect(link).toHaveAttribute('href', TESTFLIGHT_URL);
    expect(TESTFLIGHT_URL).toContain('testflight.apple.com/join/');
  });

  it('mentions installing as a PWA', () => {
    render(<DownloadPage />);
    expect(screen.getByText(/Add to Home Screen/)).toBeInTheDocument();
  });
});
