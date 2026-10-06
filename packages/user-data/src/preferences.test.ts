import { afterEach, describe, expect, it } from 'vitest';

import { readThemePreference, THEME_STORAGE_KEY, writeThemePreference } from './preferences';

afterEach(() => {
  window.localStorage.clear();
});

describe('preferência de tema', () => {
  it('começa sem preferência', () => {
    expect(readThemePreference()).toBeNull();
  });

  it('grava e lê o tema escolhido', () => {
    writeThemePreference('dark');
    expect(readThemePreference()).toBe('dark');
  });

  it('ignora valor corrompido', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'roxo');
    expect(readThemePreference()).toBeNull();
  });
});
