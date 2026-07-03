import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({ choice: 'system' as string, setTheme: vi.fn() }));
vi.mock('./useTheme', () => ({ useTheme: () => ({ choice: h.choice, setTheme: h.setTheme }) }));

import { SettingsPage } from './SettingsPage';

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.choice = 'system';
  });

  it('offers system/light/dark theme options', () => {
    render(<SettingsPage />);
    expect(screen.getByTestId('theme-system')).toBeInTheDocument();
    expect(screen.getByTestId('theme-light')).toBeInTheDocument();
    expect(screen.getByTestId('theme-dark')).toBeInTheDocument();
  });

  it('changing the segment sets the theme', () => {
    render(<SettingsPage />);
    fireEvent(
      screen.getByTestId('theme-segment'),
      new CustomEvent('ionChange', { detail: { value: 'dark' } }),
    );
    expect(h.setTheme).toHaveBeenCalledWith('dark');
  });
});
