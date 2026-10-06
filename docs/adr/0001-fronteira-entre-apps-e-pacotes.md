# ADR 0001 — Fronteira entre micro-frontends e bibliotecas

- Status: aceito
- Data: 2026-10-06

## Contexto

O Nexo Filmes é dividido entre três times que evoluem em ritmos diferentes:
catálogo, detalhe do filme e "minha área" (favoritos, painel e contador do
cabeçalho). Um Shell hospeda todos. Se um micro-frontend importar código de
outro, os deploys voltam a ficar acoplados e a divisão perde o sentido.

Ao mesmo tempo, há código que todos precisam: tipos de domínio, o cliente da
TMDB, o repositório de dados do usuário e o design system.

## Decisão

O monorepo tem duas categorias de pacote, com regras diferentes:

| Pasta        | O que é                   | Pode importar       | Pode ser importado por |
| ------------ | ------------------------- | ------------------- | ---------------------- |
| `apps/*`     | Micro-frontends (deploy)  | `packages/*`        | ninguém                |
| `packages/*` | Bibliotecas (versionadas) | outros `packages/*` | `apps/*`, `packages/*` |

Micro-frontends conversam apenas por três canais:

1. **URL**: rotas e query string, tipadas por `AppRoute` e `CatalogSearchParams`.
2. **Eventos** em `window` (`CustomEvent`), tipados por `NexoEventMap`.
3. **`@nexo/contracts`**, que contém **só tipos** e é consumido com `import type`.

O Shell carrega cada remote pelo nome do módulo exposto (`catalogo/CatalogPage`),
uma string resolvida em runtime pelo Module Federation, nunca por import.

## Como é garantido

- `import-x/no-restricted-paths`: um arquivo em `apps/X` não importa de `apps/Y`.
- `@typescript-eslint/no-restricted-imports`: bloqueia `@nexo/<app>` em qualquer
  app ou pacote e só permite `import type` de `@nexo/contracts`.
- `@nexo/contracts` não tem entrada de runtime no `package.json` (só `types`).
- `no-restricted-globals` e `no-restricted-properties` bloqueiam `localStorage`
  fora de `packages/user-data`.

## Consequências

- Pacotes compartilhados viram dependência de build de todos os apps. Uma
  mudança incompatível em `@nexo/tmdb` exige atualizar todos; por isso a
  superfície pública dos pacotes é pequena e tipada.
- `@nexo/user-data` é compartilhado como singleton do Module Federation para
  que a store seja uma só na página. Mesmo assim, a sincronização é feita por
  eventos, então um remote com uma cópia própria (rodando sozinho, ou com
  versão divergente) continua coerente.
- O Shell depende de um contrato implícito com cada remote: ele fornece
  Router, QueryClient e Toaster. Isso está documentado em `@nexo/contracts`
  e é reproduzido pelo mini-shell de desenvolvimento de cada remote.
