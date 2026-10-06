import type { MovieSnapshot } from '@nexo/contracts';

import { createLocalUserDataRepository } from './repository';
import type { LocalRepositoryOptions } from './repository';
import { createMemoryStorage } from './storage';

/** Snapshot de filme para testes. */
export function snapshot(id: number, overrides: Partial<MovieSnapshot> = {}): MovieSnapshot {
  return {
    id,
    title: `Filme ${String(id)}`,
    year: 2001,
    posterUrl: null,
    genres: [{ id: 18, name: 'Drama' }],
    ...overrides,
  };
}

/** Repositório sem atraso e sem falhas, salvo quando o teste pede. */
export function testRepository(overrides: Partial<LocalRepositoryOptions> = {}) {
  const storage = overrides.storage ?? createMemoryStorage();
  return {
    storage,
    repository: createLocalUserDataRepository({
      storage,
      delay: 0,
      shouldFail: () => false,
      eventTarget: null,
      ...overrides,
    }),
  };
}
