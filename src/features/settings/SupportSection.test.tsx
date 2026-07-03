import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SupportSection, SUPPORT_EMAIL } from './SupportSection';

describe('SupportSection', () => {
  it('offers a mailto support link', () => {
    render(<SupportSection />);
    const link = screen.getByTestId('support-email');
    expect(link).toHaveAttribute('href', expect.stringContaining(`mailto:${SUPPORT_EMAIL}`));
    expect(link).toHaveTextContent(SUPPORT_EMAIL);
  });
});
