import type { z } from 'zod';

import { UserDataError } from './errors';
import type { StorageKey } from './schemas';

/** Subconjunto da Web Storage API de que o repositório precisa. */
export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>;

/**
 * Lê uma lista versionada e valida item a item. Dado corrompido (JSON
 * inválido, formato inesperado ou itens quebrados) nunca derruba a app: o
 * que não passa no schema é descartado.
 */
export function readList<T>(storage: KeyValueStorage, key: StorageKey, schema: z.ZodType<T>): T[] {
  let raw: string | null;
  try {
    raw = storage.getItem(key);
  } catch {
    return [];
  }
  if (raw === null) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const items: T[] = [];
  for (const item of parsed) {
    const result = schema.safeParse(item);
    if (result.success) items.push(result.data);
  }
  return items;
}

export function writeList(
  storage: KeyValueStorage,
  key: StorageKey,
  items: readonly unknown[],
): void {
  try {
    storage.setItem(key, JSON.stringify(items));
  } catch (error) {
    throw new UserDataError('storage', { cause: error });
  }
}

/** Armazenamento em memória, usado quando o navegador bloqueia o localStorage. */
export function createMemoryStorage(): KeyValueStorage {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}
