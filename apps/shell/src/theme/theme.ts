import { readThemePreference, writeThemePreference } from '@nexo/user-data';
import type { ThemePreference } from '@nexo/user-data';

function systemTheme(): ThemePreference {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Tema efetivo: a escolha do usuário ou, sem escolha, o tema do sistema. */
export function currentTheme(): ThemePreference {
  return readThemePreference() ?? systemTheme();
}

export function applyTheme(theme: ThemePreference): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function setTheme(theme: ThemePreference): void {
  writeThemePreference(theme);
  applyTheme(theme);
}
