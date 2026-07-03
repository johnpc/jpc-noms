import { describe, it, expect } from 'vitest';
import { readThemeChoice, writeThemeChoice, shouldUseDark, THEME_STORAGE_KEY } from './theme';

const store = (initial?: string) => {
  let v = initial ?? null;
  return {
    getItem: () => v,
    setItem: (_k: string, val: string) => {
      v = val;
    },
    read: () => v,
  };
};

describe('readThemeChoice', () => {
  it('defaults to system when unset or invalid', () => {
    expect(readThemeChoice(store())).toBe('system');
    expect(readThemeChoice(store('bogus'))).toBe('system');
  });
  it('returns a valid stored choice', () => {
    expect(readThemeChoice(store('dark'))).toBe('dark');
  });
});

describe('writeThemeChoice', () => {
  it('persists under the theme key', () => {
    const s = store();
    writeThemeChoice(s, 'light');
    expect(s.read()).toBe('light');
    expect(THEME_STORAGE_KEY).toBe('noms.theme');
  });
});

describe('shouldUseDark', () => {
  it('forces dark/light regardless of system', () => {
    expect(shouldUseDark('dark', false)).toBe(true);
    expect(shouldUseDark('light', true)).toBe(false);
  });
  it('follows the OS when system', () => {
    expect(shouldUseDark('system', true)).toBe(true);
    expect(shouldUseDark('system', false)).toBe(false);
  });
});
