import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SettingsSection } from './SettingsSection';

describe('SettingsSection', () => {
  it('renders the title and its children', () => {
    render(
      <SettingsSection title="Appearance">
        <p>row</p>
      </SettingsSection>,
    );
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('row')).toBeInTheDocument();
  });
});
