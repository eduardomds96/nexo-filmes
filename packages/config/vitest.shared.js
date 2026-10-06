// @ts-check
/**
 * Opções de teste comuns a todos os projetos do monorepo. Cada pacote/app
 * tem seu `vitest.config.ts` (que não carrega o plugin de federação) e a raiz
 * agrega todos como `projects`, com a cobertura configurada lá.
 */
export const sharedTestOptions = {
  restoreMocks: true,
  clearMocks: true,
  unstubEnvs: true,
  unstubGlobals: true,
  // Folga para máquinas lentas e para a execução com cobertura.
  testTimeout: 15_000,
};
