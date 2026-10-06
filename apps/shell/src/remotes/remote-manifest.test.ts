import { describe, expect, it } from 'vitest';

import { resolveRemoteEntries } from './remote-manifest';

const fallback = {
  catalogo: 'http://localhost:3001/remoteEntry.js',
  filme: 'http://localhost:3002/remoteEntry.js',
  minha_area: 'http://localhost:3003/remoteEntry.js',
};

const json =
  (body: unknown, status = 200) =>
  () =>
    Promise.resolve(new Response(JSON.stringify(body), { status }));

describe('resolveRemoteEntries', () => {
  it('usa as URLs do remotes.json quando ele é válido', async () => {
    const manifest = {
      catalogo: 'https://cdn.exemplo.com/catalogo/remoteEntry.js',
      filme: 'https://cdn.exemplo.com/filme/remoteEntry.js',
      minha_area: 'https://cdn.exemplo.com/minha-area/remoteEntry.js',
    };
    await expect(resolveRemoteEntries(fallback, json(manifest))).resolves.toEqual({
      entries: manifest,
      source: 'manifest',
    });
  });

  it.each([
    ['ausente (404)', json({}, 404)],
    ['sem um dos remotes', json({ catalogo: 'https://x/remoteEntry.js' })],
    ['com URL inválida', json({ ...fallback, filme: 'javascript:alert(1)' })],
    ['que não é JSON', () => Promise.resolve(new Response('<html>'))],
    ['inacessível', () => Promise.reject(new TypeError('Failed to fetch'))],
  ])('cai nas URLs do build quando o manifesto está %s', async (_, fetchManifest) => {
    await expect(resolveRemoteEntries(fallback, fetchManifest)).resolves.toEqual({
      entries: fallback,
      source: 'build',
    });
  });
});
