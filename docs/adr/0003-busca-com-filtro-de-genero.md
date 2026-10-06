# ADR 0003 — Busca por título combinada com filtro de gênero

- Status: aceito
- Data: 2026-10-06

## Contexto

O catálogo permite buscar por título e filtrar por gênero ao mesmo tempo,
com o estado na URL (`/filmes?q=&genero=&pagina=`). A TMDB, porém, oferece
dois endpoints diferentes:

- `GET /discover/movie` aceita `with_genres`, mas não busca por título.
- `GET /search/movie` busca por título, mas ignora qualquer filtro de gênero.

## Decisão

- **Sem busca** (ou com menos de 2 letras): usamos `/discover/movie` e o
  gênero é filtrado no servidor. A paginação é exata.
- **Com busca e gênero**: usamos `/search/movie` e aplicamos o filtro de
  gênero **sobre os resultados da página atual**, pelos gêneros de cada filme
  (`genre_ids`). A paginação continua sendo a da busca.
- A interface avisa isso com um texto fixo acima dos resultados, e o resumo
  anunciado por leitor de tela diz quantos filmes do gênero há "nesta página
  da busca" e o total de resultados da busca.
- Se nenhum filme da página for do gênero, o estado vazio sugere ir para a
  próxima página ou trocar o gênero.

A regra está isolada e testada em `apps/catalogo/src/domain/catalog-request.ts`.

## Alternativas consideradas

- **Buscar várias páginas da busca até completar 20 resultados do gênero.**
  Daria páginas cheias, mas multiplica as requisições por tela (e a chance de
  429), torna a paginação imprevisível e o "Página X de Y" deixaria de fazer
  sentido. Rejeitada.
- **Desabilitar o gênero enquanto há busca.** Simples, mas tira uma função
  que o usuário espera. Rejeitada.
- **Usar `/discover/movie` com `with_text_query`.** O parâmetro não existe na
  API v3 para filmes.

## Consequências

- Uma página da busca filtrada pode ter menos de 20 filmes, ou nenhum.
- O número total exibido é o da busca, não o do gênero. O aviso deixa isso
  explícito.
