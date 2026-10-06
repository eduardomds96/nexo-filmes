# ADR 0002 — Vite com `@module-federation/vite` e remotes registrados em runtime

- Status: aceito
- Data: 2026-10-06

## Contexto

Precisamos de um Shell e três remotes, cada um com dev server próprio, com
uma única cópia de React, React DOM e React Router na página. As opções
avaliadas foram Vite com `@module-federation/vite` e Rsbuild/Rspack com
Module Federation 2.0.

## Decisão

Usar **Vite 8 + `@module-federation/vite` 1.23**. O plugin é mantido pela
organização do Module Federation, roda sobre o mesmo runtime 2.x do Rspack
(`@module-federation/runtime`) e suporta Vite 8 oficialmente. Nos testes de
integração ele funcionou em dev e em build sem ajustes.

Os remotes **não** são declarados no `vite.config.ts` do Shell. O Shell os
registra em runtime com `registerRemotes` (`apps/shell/src/remotes`). Motivo:

- O plugin renomeia internamente remotes declarados no config, e um novo
  `registerRemotes` com o mesmo nome não substitui o original. Sem o registro
  em runtime, o botão "Tentar novamente" não consegue recarregar um remote.
- O Chrome memoriza no mapa de módulos ES um `import()` que falhou. Para uma
  nova tentativa real, o remote é registrado de novo com a URL acrescida de
  `?tentativa=N`, o que força uma nova requisição do `remoteEntry.js`.
- Abre caminho para resolver as URLs dos remotes em runtime (manifesto).

As dependências que precisam ser únicas são declaradas em um só lugar,
`packages/config/federation.js`, com `singleton: true` e `requiredVersion`
derivado do `package.json` de cada app.

## Alternativas

- **Rsbuild + MF 2.0**: integração mais madura e com DTS automático, mas
  trocaria o ecossistema de testes e plugins (Vitest e Tailwind usam Vite).
  Fica como plano B caso o plugin do Vite se mostre instável.
- **`import('catalogo/CatalogPage')` estático**: mais simples, mas sem
  recarregamento real em caso de falha.

## Consequências

- O tipo dos módulos remotos não é gerado automaticamente (`dts: false`); ele
  vem de `RemoteModuleMap` em `@nexo/contracts`, e o Shell valida em runtime
  que o módulo tem um `default` que é componente.
- Derrubar um processo de `pnpm dev` encerra todos os outros, porque o
  Turborepo para as tarefas persistentes quando uma termina. Para simular a
  queda de um remote, rode os apps separadamente (ver README).
