import { readThemePreference, writeThemePreference } from '@nexo/user-data';
import { afterEach, describe, expect, it } from 'vitest';

import { applyTheme, currentTheme, setTheme } from './theme';

afterEach(() => {
  document.documentElement.className = '';
});

describe('tema', () => {
  it('sem escolha salva, o tema é escuro', () => {
    expect(readThemePreference()).toBeNull();
    expect(currentTheme()).toBe('dark');
  });

  it('respeita a escolha salva', () => {
    writeThemePreference('light');
    expect(currentTheme()).toBe('light');
  });

  it('aplica uma única classe de tema no <html>', () => {
    const root = document.documentElement;
    applyTheme('light');
    expect([...root.classList]).toEqual(['light']);
    applyTheme('dark');
    expect([...root.classList]).toEqual(['dark']);
  });

  it('setTheme grava e aplica', () => {
    setTheme('light');
    expect(readThemePreference()).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });
});
