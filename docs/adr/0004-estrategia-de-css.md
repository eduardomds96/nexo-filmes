# ADR 0004 — CSS entre Shell e remotes

- Status: aceito
- Data: 2026-10-06

## Contexto

Os quatro apps usam Tailwind CSS v4 e os componentes de `@nexo/ui`
(shadcn/ui). Cada remote é construído e publicado sozinho, então precisa
levar o CSS dos utilitários que usa. Isso cria dois riscos:

1. **Duplicação** de preflight, tokens e estilos de base.
2. **Conflito de cascata.** Um remote redeclara um utilitário (ex.: `.w-full`)
   num arquivo que chega depois do CSS do Shell. Na mesma camada, a regra
   posterior vence variantes responsivas do Shell (ex.: `sm:w-auto`). Isso
   aconteceu de fato no cabeçalho durante o desenvolvimento.

## Decisão

- **O Shell é dono da base.** Só ele carrega preflight, os tokens de cor
  (`@nexo/ui/styles/tokens.css`, claro e escuro) e os estilos de base
  (`base.css`). Esses arquivos existem uma única vez na página.
- **Cada remote gera só utilitários**, a partir de `src/styles/remote.css`,
  importado pelos módulos expostos. O mapeamento dos tokens para o Tailwind
  (`theme.css`, com `@theme inline`) é compartilhado e não gera CSS de base.
- **Os utilitários de cada remote ficam confinados ao contêiner dele.** O
  plugin PostCSS `scopeRemoteUtilities` (`packages/config`) envolve o
  conteúdo de `@layer utilities` em `@scope ([data-nexo-remote="<nome>"])`.
  O Shell renderiza cada remote dentro de um `div` com esse atributo
  (`display: contents`, sem efeito no layout). Assim, nenhuma regra de um
  remote alcança o cabeçalho do Shell ou a área de outro remote.
- Dentro da área do remote, as regras dele chegam depois das do Shell e
  mantêm a ordem interna correta, então as variantes responsivas funcionam.
- O **mini-shell de desenvolvimento** de cada remote faz o papel do Shell:
  carrega `dev.css` (preflight, tokens e base) e envolve a página no mesmo
  atributo.

## Alternativas consideradas

- **Prefixo do Tailwind por remote** (`ct:flex`). Isola também, mas obriga
  cada time a escrever classes prefixadas e não resolve as classes dos
  componentes de `@nexo/ui`, que são compartilhados.
- **Um único CSS gerado pelo Shell lendo o código de todos os remotes.**
  Acopla o deploy: um remote com uma classe nova exigiria rebuild do Shell.
- **Shadow DOM por remote.** Isolamento total, mas quebra portais (toasts,
  diálogos) e o tema global.

## Consequências

- Requer suporte a `@scope` (Chrome 118+, Safari 17.4+, Firefox 146+).
- Utilitários idênticos podem existir no CSS do Shell e no de um remote. O
  custo é pequeno (só o que cada um usa) e o comportamento é previsível.
- Variáveis de tema e `@property` continuam globais, por isso não são
  confinadas.
