import type { RemoteName } from '@nexo/contracts';
import { z } from 'zod';

export type RemoteEntries = Record<RemoteName, string>;

export const REMOTES_MANIFEST_PATH = '/remotes.json';

const entrySchema = z.url({ protocol: /^https?$/ });

const manifestSchema = z.object({
  catalogo: entrySchema,
  filme: entrySchema,
  minha_area: entrySchema,
});

/**
 * Resolve as URLs dos remotes em runtime. O build gera um `remotes.json` a
 * partir das variáveis de ambiente; quem publica pode editá-lo sem rebuild.
 * Se o manifesto faltar ou for inválido, valem as URLs embutidas no build.
 */
export async function resolveRemoteEntries(
  fallback: RemoteEntries,
  fetchManifest: () => Promise<Response> = () =>
    fetch(REMOTES_MANIFEST_PATH, { cache: 'no-store' }),
): Promise<{ entries: RemoteEntries; source: 'manifest' | 'build' }> {
  try {
    const response = await fetchManifest();
    if (!response.ok) return { entries: fallback, source: 'build' };
    const parsed = manifestSchema.safeParse(await response.json());
    return parsed.success
      ? { entries: parsed.data, source: 'manifest' }
      : { entries: fallback, source: 'build' };
  } catch {
    return { entries: fallback, source: 'build' };
  }
}
