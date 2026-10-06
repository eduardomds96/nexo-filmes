import { describe, expect, it } from 'vitest';

import {
  DEFAULT_USER_DATA_CONFIG,
  failWhenIdEndsWith,
  randomDelay,
  readUserDataConfig,
} from './config';

describe('readUserDataConfig', () => {
  it('usa 300–1500 ms e sufixo 13 por padrão', () => {
    expect(readUserDataConfig({})).toEqual(DEFAULT_USER_DATA_CONFIG);
    expect(DEFAULT_USER_DATA_CONFIG).toEqual({
      minDelayMs: 300,
      maxDelayMs: 1500,
      failSuffix: '13',
    });
  });

  it('lê atraso e sufixo das variáveis de ambiente', () => {
    expect(
      readUserDataConfig({
        VITE_USER_DATA_MIN_DELAY_MS: '0',
        VITE_USER_DATA_MAX_DELAY_MS: '50',
        VITE_USER_DATA_FAIL_SUFFIX: '7',
      }),
    ).toEqual({ minDelayMs: 0, maxDelayMs: 50, failSuffix: '7' });
  });

  it('sufixo vazio ou não numérico desliga a falha simulada', () => {
    expect(readUserDataConfig({ VITE_USER_DATA_FAIL_SUFFIX: '' }).failSuffix).toBeNull();
    expect(readUserDataConfig({ VITE_USER_DATA_FAIL_SUFFIX: 'nunca' }).failSuffix).toBeNull();
  });

  it('ignora valores inválidos e corrige mínimo maior que máximo', () => {
    expect(readUserDataConfig({ VITE_USER_DATA_MIN_DELAY_MS: 'abc' }).minDelayMs).toBe(300);
    expect(
      readUserDataConfig({
        VITE_USER_DATA_MIN_DELAY_MS: '900',
        VITE_USER_DATA_MAX_DELAY_MS: '100',
      }),
    ).toMatchObject({ minDelayMs: 100, maxDelayMs: 900 });
  });
});

describe('randomDelay', () => {
  it('gera valores entre o mínimo e o máximo', () => {
    expect(randomDelay(300, 1500, () => 0)()).toBe(300);
    expect(randomDelay(300, 1500, () => 1)()).toBe(1500);
    expect(randomDelay(300, 1500, () => 0.5)()).toBe(900);
  });
});

describe('failWhenIdEndsWith', () => {
  it('falha apenas para ids terminados no sufixo', () => {
    const shouldFail = failWhenIdEndsWith('13');
    expect(shouldFail(13)).toBe(true);
    expect(shouldFail(413)).toBe(true);
    expect(shouldFail(131)).toBe(false);
    expect(shouldFail(550)).toBe(false);
  });

  it('sem sufixo nunca falha', () => {
    expect(failWhenIdEndsWith(null)(13)).toBe(false);
  });
});
