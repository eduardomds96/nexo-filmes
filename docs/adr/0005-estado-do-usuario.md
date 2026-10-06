# ADR 0005 — Estado do usuário: repositório, store e eventos

- Status: aceito
- Data: 2026-10-06

## Contexto

Favoritos e avaliações ficam no navegador, mas devem ser tratados como se
viessem de um back-end: interface assíncrona, latência e falhas. Um filme
favoritado em qualquer micro-frontend precisa aparecer igual em todos os
outros e no contador do cabeçalho, sem recarregar, inclusive em outra aba.

## Decisão

Tudo fica em `@nexo/user-data`, o único pacote autorizado a usar o
localStorage (regra de lint).

1. **Repositório** (`createLocalUserDataRepository`): implementa a interface
   assíncrona `UserDataRepository` de `@nexo/contracts`. Recebe por injeção o
   armazenamento, o atraso (`delay`) e a regra de falha (`shouldFail`). Os
   valores padrão vêm das variáveis `VITE_USER_DATA_*` (300–1500 ms e falha
   em ids terminados em `13`); nos testes, `0` e `() => false`.
2. **Formato versionado** nas chaves `nexo:v1:favorites` e `nexo:v1:ratings`,
   validado com Zod item a item na leitura. Dado corrompido é descartado,
   nunca derruba a app, e é regravado limpo na próxima escrita.
3. **Store** (`createUserDataStore`), lida via `useSyncExternalStore`:
   - Favorito otimista: muda na hora, marca o id como pendente, emite
     `nexo:favorites:changed` com `status: 'pending'`; ao confirmar, o
     repositório emite `committed`; se falhar, a store volta ao estado
     anterior e emite `reverted`. A UI mostra o toast.
   - Um segundo toggle do mesmo filme enquanto o primeiro está pendente é
     ignorado, e o botão fica com `aria-disabled`.
4. **Coerência**:
   - Mesma página: `@nexo/user-data` é **singleton** do Module Federation,
     então todos os remotes usam a mesma store.
   - Cópias diferentes da store (remote rodando sozinho, ou versão
     divergente): cada store escuta os eventos `nexo:*` em `window` e se
     ressincroniza lendo o armazenamento sem atraso.
   - Outras abas: o evento `storage` dispara a mesma ressincronização.

## Por que não Context, Redux ou TanStack Query para isso

- Um Context exigiria um provider comum acima de todos os remotes, ou seja,
  acoplamento ao Shell. A store funciona igual integrada e isolada.
- TanStack Query é ótimo para dados remotos com cache, mas o estado
  otimista com pendência por item e a sincronização por eventos ficam mais
  simples e testáveis numa store pequena e sem dependências.

## Consequências

- As regras de negócio (toggle, substituição da avaliação, falha do 13,
  atraso, dados corrompidos, sincronização) são testáveis sem React.
- Pendências não atravessam abas: outra aba só vê o resultado confirmado.
