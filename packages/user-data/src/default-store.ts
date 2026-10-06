import { failWhenIdEndsWith, randomDelay, readUserDataConfig } from './config';
import { createLocalUserDataRepository } from './repository';
import { createMemoryStorage } from './storage';
import type { KeyValueStorage } from './storage';
import { createUserDataStore } from './store';
import type { UserDataStore } from './store';

function browserStorage(): KeyValueStorage {
  try {
    const storage = window.localStorage;
    const probe = 'nexo:probe';
    storage.setItem(probe, probe);
    storage.removeItem(probe);
    return storage;
  } catch {
    // Modo privado restrito ou armazenamento bloqueado: segue em memória.
    return createMemoryStorage();
  }
}

let defaultStore: UserDataStore | null = null;

/**
 * Store padrão da página, configurada pelas variáveis `VITE_USER_DATA_*`.
 * Como este pacote é um singleton do Module Federation, todos os
 * micro-frontends integrados recebem a mesma instância.
 */
export function getDefaultUserDataStore(): UserDataStore {
  if (!defaultStore) {
    const config = readUserDataConfig(import.meta.env);
    defaultStore = createUserDataStore({
      repository: createLocalUserDataRepository({
        storage: browserStorage(),
        delay: randomDelay(config.minDelayMs, config.maxDelayMs),
        shouldFail: failWhenIdEndsWith(config.failSuffix),
      }),
    });
  }
  return defaultStore;
}
