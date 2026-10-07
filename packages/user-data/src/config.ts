import { z } from 'zod';

/**
 * Comportamento simulado do "back-end" local. Os padrões seguem a
 * especificação do produto; as variáveis de ambiente permitem ajustá-los.
 */
export interface UserDataConfig {
  readonly minDelayMs: number;
  readonly maxDelayMs: number;
  /** Escritas em filmes cujo id termina com este sufixo falham. `null` desliga a falha. */
  readonly failSuffix: string | null;
}

export const DEFAULT_USER_DATA_CONFIG: UserDataConfig = {
  minDelayMs: 300,
  maxDelayMs: 1500,
  failSuffix: '13',
};

const delaySchema = z.coerce.number().int().min(0).max(60_000);

/** Lê a configuração de um objeto de ambiente (ex.: `import.meta.env`). Valores inválidos usam o padrão. */
export function readUserDataConfig(env: Readonly<Record<string, unknown>>): UserDataConfig {
  const min = delaySchema.safeParse(env['VITE_USER_DATA_MIN_DELAY_MS'] ?? undefined);
  const max = delaySchema.safeParse(env['VITE_USER_DATA_MAX_DELAY_MS'] ?? undefined);
  const minDelayMs = min.success ? min.data : DEFAULT_USER_DATA_CONFIG.minDelayMs;
  const maxDelayMs = max.success ? max.data : DEFAULT_USER_DATA_CONFIG.maxDelayMs;

  const rawSuffix = env['VITE_USER_DATA_FAIL_SUFFIX'];
  let failSuffix = DEFAULT_USER_DATA_CONFIG.failSuffix;
  if (typeof rawSuffix === 'string') {
    const trimmed = rawSuffix.trim();
    failSuffix = /^\d+$/.test(trimmed) ? trimmed : null;
  }

  return {
    minDelayMs: Math.min(minDelayMs, maxDelayMs),
    maxDelayMs: Math.max(minDelayMs, maxDelayMs),
    failSuffix,
  };
}

export function randomDelay(
  min: number,
  max: number,
  random: () => number = Math.random,
): () => number {
  return () => Math.round(min + random() * (max - min));
}

export function failWhenIdEndsWith(suffix: string | null): (movieId: number) => boolean {
  if (suffix === null || suffix === '') return () => false;
  return (movieId) => String(movieId).endsWith(suffix);
}
