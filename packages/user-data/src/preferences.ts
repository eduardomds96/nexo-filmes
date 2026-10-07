import { z } from 'zod';

export type ThemePreference = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'nexo:v1:theme';

const themeSchema = z.enum(['light', 'dark']);

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Lê a preferência salva. `null` quando o usuário nunca escolheu (segue o sistema). */
export function readThemePreference(): ThemePreference | null {
  try {
    const parsed = themeSchema.safeParse(storage()?.getItem(THEME_STORAGE_KEY));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function writeThemePreference(theme: ThemePreference): void {
  try {
    storage()?.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Preferência de tema não é crítica: sem armazenamento, vale só nesta sessão.
  }
}
