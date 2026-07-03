/** Pure theme helpers — no I/O, unit-tested. */

export type ThemeChoice = 'system' | 'light' | 'dark';

const KEY = 'noms.theme';
const CHOICES: ThemeChoice[] = ['system', 'light', 'dark'];

const isChoice = (v: string | null): v is ThemeChoice => !!v && CHOICES.includes(v as ThemeChoice);

/** The persisted theme choice, defaulting to 'system'. */
export function readThemeChoice(store: Pick<Storage, 'getItem'>): ThemeChoice {
  const v = store.getItem(KEY);
  return isChoice(v) ? v : 'system';
}

/** Persist a theme choice. */
export function writeThemeChoice(store: Pick<Storage, 'setItem'>, choice: ThemeChoice): void {
  store.setItem(KEY, choice);
}

/** Resolve a choice to whether dark should be ON, given the OS preference. */
export function shouldUseDark(choice: ThemeChoice, systemPrefersDark: boolean): boolean {
  if (choice === 'dark') return true;
  if (choice === 'light') return false;
  return systemPrefersDark;
}

export { KEY as THEME_STORAGE_KEY, CHOICES as THEME_CHOICES };
