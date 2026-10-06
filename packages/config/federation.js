// @ts-check
/**
 * Configuração de Module Federation compartilhada pelos quatro apps.
 * Código de build (Node), não de runtime: nenhum micro-frontend importa outro.
 */

/** Portas fixas dos dev servers e do preview. */
export const PORTS = /** @type {const} */ ({
  shell: 3000,
  catalogo: 3001,
  filme: 3002,
  minha_area: 3003,
});

/**
 * Dependências que precisam existir uma única vez na página.
 * React, React DOM e o roteador por exigência do React; TanStack Query para
 * compartilhar o cache entre remotes; sonner para que todos os toasts caiam
 * no mesmo <Toaster/>; @nexo/user-data para que a store seja uma só.
 */
const SINGLETONS = [
  'react',
  'react-dom',
  'react-router',
  '@tanstack/react-query',
  'sonner',
  '@nexo/user-data',
];

/**
 * @param {{ dependencies?: Record<string, string> }} pkg package.json do app
 * @returns {Record<string, { singleton: true; requiredVersion: string }>}
 */
export function createShared(pkg) {
  const deps = pkg.dependencies ?? {};
  /** @type {Record<string, { singleton: true; requiredVersion: string }>} */
  const shared = {};
  for (const name of SINGLETONS) {
    const version = deps[name];
    if (version === undefined) continue;
    shared[name] = {
      singleton: true,
      requiredVersion: version.startsWith('workspace:') ? '*' : `^${version.replace(/^[\^~]/, '')}`,
    };
  }
  return shared;
}

/**
 * URL do remoteEntry de cada remote. Pode ser sobrescrita por variável de
 * ambiente para apontar para outro host (ex.: um remote publicado em CDN).
 * @param {Record<string, string | undefined>} env
 */
export function remoteEntries(env) {
  /** @param {keyof typeof PORTS} name */
  const url = (name) =>
    env[`VITE_REMOTE_${name.toUpperCase()}_URL`] ??
    `http://localhost:${PORTS[name]}/remoteEntry.js`;
  return {
    catalogo: url('catalogo'),
    filme: url('filme'),
    minha_area: url('minha_area'),
  };
}
