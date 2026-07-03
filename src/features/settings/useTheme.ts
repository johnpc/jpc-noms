import { useCallback, useEffect, useState } from 'react';
import { readThemeChoice, writeThemeChoice, shouldUseDark, type ThemeChoice } from './theme';

const DARK_CLASS = 'ion-palette-dark';

const prefersDark = (): boolean =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;

/** Apply/remove Ionic's dark palette class on <html>. */
function applyDark(on: boolean): void {
  document.documentElement.classList.toggle(DARK_CLASS, on);
}

/**
 * Theme state: the user's choice (system/light/dark), persisted, applied to the
 * document, and kept in sync with the OS setting while on 'system'.
 */
export function useTheme() {
  const [choice, setChoice] = useState<ThemeChoice>(() => readThemeChoice(localStorage));

  useEffect(() => {
    applyDark(shouldUseDark(choice, prefersDark()));
    if (choice !== 'system' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyDark(shouldUseDark('system', mq.matches));
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [choice]);

  const setTheme = useCallback((next: ThemeChoice) => {
    writeThemeChoice(localStorage, next);
    setChoice(next);
  }, []);

  return { choice, setTheme };
}
