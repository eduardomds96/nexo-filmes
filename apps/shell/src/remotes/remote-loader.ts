import { loadRemote, registerRemotes } from '@module-federation/runtime';
import type { RemoteModuleId, RemoteModuleMap, RemoteName } from '@nexo/contracts';

declare const __NEXO_REMOTES__: Record<RemoteName, string>;

export type RemoteModule<Id extends RemoteModuleId> = { default: RemoteModuleMap[Id] };

export class RemoteLoadError extends Error {
  override readonly name = 'RemoteLoadError';
  readonly remote: RemoteName;

  constructor(remote: RemoteName, cause: unknown) {
    super(`Não foi possível carregar o módulo remoto "${remote}".`, { cause });
    this.remote = remote;
  }
}

export function remoteNameOf(id: RemoteModuleId): RemoteName {
  return id.slice(0, id.indexOf('/')) as RemoteName;
}

function register(name: RemoteName, entry: string, force: boolean): void {
  registerRemotes([{ name, entry, type: 'module', shareScope: 'default' }], { force });
}

/** Registra no runtime do Module Federation os remotes conhecidos pelo Shell. */
export function registerKnownRemotes(): void {
  for (const [name, entry] of Object.entries(__NEXO_REMOTES__)) {
    register(name as RemoteName, entry, false);
  }
}

/** Quantas cargas de cada remote já falharam desde o último sucesso. */
const failures = new Map<RemoteName, number>();

/**
 * Prepara uma nova tentativa depois de uma falha.
 *
 * O runtime do Module Federation já descarta a carga que falhou, mas o
 * navegador memoriza o `import()` que falhou para aquela URL no mapa de
 * módulos ES. Por isso o remote é registrado de novo com uma URL única,
 * o que força uma nova requisição do remoteEntry.
 */
function prepareRetry(remote: RemoteName, attempt: number): void {
  const entry = new URL(__NEXO_REMOTES__[remote]);
  entry.searchParams.set('tentativa', String(attempt));
  register(remote, entry.href, true);
}

function hasDefaultExport(value: unknown): value is { default: unknown } {
  return typeof value === 'object' && value !== null && 'default' in value;
}

/** Carrega um módulo exposto por um remote e garante que ele tem um `default` renderizável. */
export async function loadRemoteModule<Id extends RemoteModuleId>(
  id: Id,
): Promise<RemoteModule<Id>> {
  const remote = remoteNameOf(id);
  const failed = failures.get(remote);
  if (failed !== undefined) prepareRetry(remote, failed);

  let mod: unknown;
  try {
    mod = await loadRemote<unknown>(id);
  } catch (error) {
    failures.set(remote, (failed ?? 0) + 1);
    throw new RemoteLoadError(remote, error);
  }
  failures.delete(remote);

  if (!hasDefaultExport(mod) || typeof mod.default !== 'function') {
    throw new RemoteLoadError(remote, new TypeError(`"${id}" não exporta um componente default.`));
  }
  return mod as RemoteModule<Id>;
}

const cache = new Map<RemoteModuleId, Promise<RemoteModule<RemoteModuleId>>>();

/**
 * Promise estável por módulo, para uso com `use()`. Uma carga que falhou
 * continua no cache (senão cada nova renderização dispararia outra carga) até
 * que `evictRemoteModule` seja chamado pelo "Tentar novamente".
 */
export function getRemoteModule<Id extends RemoteModuleId>(id: Id): Promise<RemoteModule<Id>> {
  let promise = cache.get(id);
  if (!promise) {
    promise = loadRemoteModule(id);
    cache.set(id, promise);
  }
  return promise as Promise<RemoteModule<Id>>;
}

/** Descarta o módulo do cache para que a próxima renderização tente carregá-lo de novo. */
export function evictRemoteModule(id: RemoteModuleId): void {
  cache.delete(id);
}

/** Só para testes: esquece módulos e falhas registrados. */
export function resetRemoteCache(): void {
  cache.clear();
  failures.clear();
}
