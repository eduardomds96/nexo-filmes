import { describe, expect, it } from 'vitest';

import {
  formatRuntime,
  formatRuntimeLong,
  formatScore,
  formatUserScore,
  initials,
  plural,
} from './format';

describe('formatação pt-BR', () => {
  it('nota com uma casa e vírgula', () => {
    expect(formatScore(7.5)).toBe('7,5');
    expect(formatScore(8)).toBe('8,0');
    expect(formatScore(7.46)).toBe('7,5');
  });

  it('nota do usuário sem casa decimal quando inteira', () => {
    expect(formatUserScore(8)).toBe('8');
    expect(formatUserScore(7.5)).toBe('7,5');
  });

  it('duração', () => {
    expect(formatRuntime(139)).toBe('2h 19min');
    expect(formatRuntime(45)).toBe('45min');
    expect(formatRuntime(120)).toBe('2h');
    expect(formatRuntimeLong(61)).toBe('1 hora e 1 minuto');
    expect(formatRuntimeLong(139)).toBe('2 horas e 19 minutos');
    expect(formatRuntimeLong(0)).toBe('0 minutos');
  });

  it('iniciais da primeira e da última palavra', () => {
    expect(initials('Edward Norton')).toBe('EN');
    expect(initials('  Fernanda   Montenegro Torres ')).toBe('FT');
    expect(initials('Zendaya')).toBe('Z');
    expect(initials('ângela leal')).toBe('ÂL');
    expect(initials('')).toBe('');
  });

  it('plural', () => {
    expect(plural(1, 'filme', 'filmes')).toBe('1 filme');
    expect(plural(1200, 'filme', 'filmes')).toBe('1.200 filmes');
  });
});
