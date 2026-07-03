import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTheme } from './useTheme';

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('ion-palette-dark');
    // Default matchMedia: OS prefers light.
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as typeof window.matchMedia;
  });

  it('applies dark when the choice is dark', () => {
    localStorage.setItem('noms.theme', 'dark');
    renderHook(() => useTheme());
    expect(document.documentElement.classList.contains('ion-palette-dark')).toBe(true);
  });

  it('does not apply dark on system when the OS prefers light', () => {
    renderHook(() => useTheme());
    expect(document.documentElement.classList.contains('ion-palette-dark')).toBe(false);
  });

  it('setTheme persists and applies the new choice', () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme('dark'));
    expect(result.current.choice).toBe('dark');
    expect(localStorage.getItem('noms.theme')).toBe('dark');
    expect(document.documentElement.classList.contains('ion-palette-dark')).toBe(true);
  });
});
