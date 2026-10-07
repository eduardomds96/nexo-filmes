import { readThemePreference, writeThemePreference } from '@nexo/user-data';
import type { ThemePreference } from '@nexo/user-data';

/** Tema sem escolha salva: o produto é escuro por padrão (ver tokens.css). */
export const DEFAULT_THEME: ThemePreference = 'dark';

export function currentTheme(): ThemePreference {
  return readThemePreference() ?? DEFAULT_THEME;
}

export function applyTheme(theme: ThemePreference): void {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.classList.toggle('light', theme === 'light');
}

export function setTheme(theme: ThemePreference): void {
  writeThemePreference(theme);
  applyTheme(theme);
}
