/**
 * Catálogo de demonstração no formato da TMDB, usado no modo de dados
 * simulados (`VITE_TMDB_MOCK=true`) e nos testes E2E. Nunca vai para produção.
 */

export const DEMO_GENRES = [
  { id: 28, name: 'Ação' },
  { id: 12, name: 'Aventura' },
  { id: 16, name: 'Animação' },
  { id: 35, name: 'Comédia' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentário' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Família' },
  { id: 14, name: 'Fantasia' },
  { id: 36, name: 'História' },
  { id: 27, name: 'Terror' },
  { id: 10402, name: 'Música' },
  { id: 9648, name: 'Mistério' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Ficção científica' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'Guerra' },
  { id: 37, name: 'Faroeste' },
] as const;

type DemoSeed = readonly [id: number, title: string, year: number, genres: readonly number[]];

const SEEDS: readonly DemoSeed[] = [
  [598, 'Cidade de Deus', 2002, [18, 80]],
  [550, 'Clube da Luta', 1999, [18]],
  [603, 'Matrix', 1999, [28, 878]],
  [13, 'Forrest Gump: O Contador de Histórias', 1994, [35, 18, 10749]],
  [680, 'Pulp Fiction: Tempo de Violência', 1994, [53, 80]],
  [238, 'O Poderoso Chefão', 1972, [18, 80]],
  [155, 'Batman: O Cavaleiro das Trevas', 2008, [18, 28, 80, 53]],
  [27205, 'A Origem', 2010, [28, 878, 12]],
  [157336, 'Interestelar', 2014, [12, 18, 878]],
  [129, 'A Viagem de Chihiro', 2001, [16, 10751, 14]],
  [496243, 'Parasita', 2019, [35, 53, 18]],
  [278, 'Um Sonho de Liberdade', 1994, [18, 80]],
  [424, 'A Lista de Schindler', 1993, [18, 36]],
  [389, '12 Homens e uma Sentença', 1957, [18]],
  [497, 'À Espera de um Milagre', 1999, [14, 18, 80]],
  [637, 'A Vida É Bela', 1997, [35, 18]],
  [769, 'Os Bons Companheiros', 1990, [18, 80]],
  [807, 'Seven: Os Sete Crimes Capitais', 1995, [80, 9648, 53]],
  [274, 'O Silêncio dos Inocentes', 1991, [80, 18, 53, 27]],
  [11216, 'Cinema Paradiso', 1988, [18, 10749]],
  [372058, 'Your Name.', 2016, [10749, 16, 18]],
  [4935, 'O Castelo Animado', 2004, [14, 16, 12]],
  [8587, 'O Rei Leão', 1994, [10751, 16, 18]],
  [862, 'Toy Story', 1995, [16, 12, 10751, 35]],
  [12477, 'Túmulo dos Vagalumes', 1988, [16, 18, 10752]],
  [313, 'Central do Brasil', 1998, [18]],
  [413, 'O Auto da Compadecida', 2000, [35, 18, 14]],
  [513, 'Tropa de Elite', 2007, [28, 18, 80]],
  [1013, 'Bacurau', 2019, [12, 53, 878]],
  [244786, 'Whiplash: Em Busca da Perfeição', 2014, [18, 10402]],
  [313369, 'La La Land: Cantando Estações', 2016, [35, 18, 10749, 10402]],
  [194, 'O Fabuloso Destino de Amélie Poulain', 2001, [35, 10749]],
  [105, 'De Volta para o Futuro', 1985, [12, 35, 878]],
  [11, 'Star Wars: Uma Nova Esperança', 1977, [12, 28, 878]],
  [120, 'O Senhor dos Anéis: A Sociedade do Anel', 2001, [12, 14, 28]],
  [122, 'O Senhor dos Anéis: O Retorno do Rei', 2003, [12, 14, 28]],
  [76341, 'Mad Max: Estrada da Fúria', 2015, [28, 12, 878]],
  [335984, 'Blade Runner 2049', 2017, [878, 18]],
  [78, 'Blade Runner: O Caçador de Androides', 1982, [878, 18, 53]],
  [62, '2001: Uma Odisseia no Espaço', 1968, [878, 9648, 12]],
  [694, 'O Iluminado', 1980, [27, 53]],
  [539, 'Psicose', 1960, [27, 18, 53]],
  [348, 'Alien: O Oitavo Passageiro', 1979, [27, 878]],
  [419430, 'Corra!', 2017, [9648, 53, 27]],
  [493922, 'Hereditário', 2018, [27, 9648, 53]],
  [13223, 'Gran Torino', 2008, [18]],
  [1422, 'Os Infiltrados', 2006, [18, 53, 80]],
  [77338, 'Intocáveis', 2011, [18, 35]],
  [106646, 'O Lobo de Wall Street', 2013, [80, 18, 35]],
  [68718, 'Django Livre', 2012, [18, 37]],
  [16869, 'Bastardos Inglórios', 2009, [18, 53, 10752]],
  [530915, '1917', 2019, [10752, 18, 28]],
  [374720, 'Dunkirk', 2017, [10752, 28, 18]],
  [205596, 'O Jogo da Imitação', 2014, [36, 18, 53]],
  [37165, 'O Show de Truman', 1998, [35, 18]],
  [1124, 'O Grande Truque', 2006, [18, 9648, 878]],
  [77, 'Amnésia', 2000, [9648, 53]],
  [14160, 'Up: Altas Aventuras', 2009, [16, 35, 10751, 12]],
  [10681, 'WALL·E', 2008, [16, 10751, 878]],
  [354912, 'Viva: A Vida É uma Festa', 2017, [10751, 16, 14, 10402]],
  [150540, 'Divertida Mente', 2015, [16, 10751, 12, 18, 35]],
  [508442, 'Soul', 2020, [16, 10751, 35, 14]],
  [569094, 'Homem-Aranha: Através do Aranhaverso', 2023, [16, 28, 12, 878]],
  [872585, 'Oppenheimer', 2023, [18, 36]],
  [693134, 'Duna: Parte Dois', 2024, [878, 12]],
  [545611, 'Tudo em Todo o Lugar ao Mesmo Tempo', 2022, [28, 12, 878]],
  [361743, 'Top Gun: Maverick', 2022, [28, 18]],
  [64690, 'Drive', 2011, [18, 53, 80]],
  [9806, 'Os Incríveis', 2004, [28, 12, 16, 10751]],
  [11324, 'Ilha do Medo', 2010, [18, 53, 9648]],
  [1891, 'O Império Contra-Ataca', 1980, [12, 28, 878]],
  [101, 'O Profissional', 1994, [80, 18, 28]],
  [12445, 'Harry Potter e as Relíquias da Morte: Parte 2', 2011, [14, 12]],
  [920, 'Carros', 2006, [16, 12, 35, 10751]],
  [99861, 'Vingadores: Era de Ultron', 2015, [28, 12, 878]],
  [299534, 'Vingadores: Ultimato', 2019, [12, 878, 28]],
  [475557, 'Coringa', 2019, [80, 53, 18]],
  [466420, 'Assassinos da Lua das Flores', 2023, [80, 18, 36]],
  [244, 'King Kong', 1933, [12, 27]],
  [19, 'Metrópolis', 1927, [18, 878]],
];

export interface DemoMovie {
  readonly id: number;
  readonly title: string;
  readonly release_date: string;
  readonly poster_path: string | null;
  readonly vote_average: number;
  readonly vote_count: number;
  readonly genre_ids: readonly number[];
  readonly overview: string;
}

/** Pseudoaleatório determinístico a partir do id, para notas e datas estáveis. */
function seeded(id: number, salt: number): number {
  const x = Math.sin(id * 9301 + salt * 49297) * 233280;
  return x - Math.floor(x);
}

export const DEMO_MOVIES: readonly DemoMovie[] = SEEDS.map(([id, title, year, genres], index) => ({
  id,
  title,
  release_date: `${String(year)}-${String(1 + Math.floor(seeded(id, 1) * 12)).padStart(2, '0')}-15`,
  // Alguns filmes sem pôster, para exercitar o placeholder.
  poster_path: index % 9 === 4 ? null : `/demo/${String(id)}.svg`,
  vote_average: Math.round((6 + seeded(id, 2) * 3.4) * 1000) / 1000,
  vote_count: 500 + Math.floor(seeded(id, 3) * 30000),
  genre_ids: genres.filter((g) => DEMO_GENRES.some((d) => d.id === g)),
  overview: `${title} é um dos filmes do catálogo de demonstração do Nexo Filmes.`,
}));

export const DEMO_PAGE_SIZE = 20;

/** Termo de busca que faz a API simulada responder 429 (para testar o erro). */
export const DEMO_RATE_LIMIT_QUERY = 'erro429';

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export function paginate<T>(items: readonly T[], page: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / DEMO_PAGE_SIZE));
  const start = (page - 1) * DEMO_PAGE_SIZE;
  return {
    page,
    total_pages: totalPages,
    total_results: items.length,
    results: items.slice(start, start + DEMO_PAGE_SIZE),
  };
}

const DEMO_DIRECTORS: Record<number, string> = {
  598: 'Fernando Meirelles',
  550: 'David Fincher',
  603: 'Lana Wachowski',
  313: 'Walter Salles',
  413: 'Guel Arraes',
  513: 'José Padilha',
  1013: 'Kleber Mendonça Filho',
};

export function demoDetails(movie: DemoMovie) {
  const director = DEMO_DIRECTORS[movie.id];
  return {
    ...movie,
    // Filmes sem pôster também ficam sem imagem de fundo, para exercitar o hero sem imagem.
    backdrop_path: movie.poster_path ? `/demo/backdrop-${String(movie.id)}.svg` : null,
    runtime: 85 + Math.floor(seeded(movie.id, 4) * 90),
    tagline: null,
    genres: movie.genre_ids.flatMap((id) => DEMO_GENRES.filter((g) => g.id === id)),
    credits: {
      cast: Array.from({ length: 6 }, (_, index) => ({
        id: movie.id * 10 + index,
        name: `Intérprete ${String(index + 1)}`,
        character: `Personagem ${String(index + 1)}`,
        // Metade do elenco sem foto, para exercitar o fallback de iniciais.
        profile_path: index % 2 === 0 ? `/demo/profile-${String(movie.id * 10 + index)}.svg` : null,
        order: index,
      })),
      // Um em cada sete filmes sem diretor, para exercitar o estado vazio.
      crew:
        movie.id % 7 === 0
          ? []
          : [{ id: movie.id * 100, name: director ?? 'Direção de Exemplo', job: 'Director' }],
    },
  };
}

const POSTER_COLORS = ['#7f1d1d', '#1e3a8a', '#14532d', '#581c87', '#7c2d12', '#134e4a'];

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (char) => `&#${String(char.charCodeAt(0))};`);
}

export function demoPosterSvg(id: number): string {
  const movie = DEMO_MOVIES.find((m) => m.id === id);
  const color = POSTER_COLORS[id % POSTER_COLORS.length] ?? '#333';
  const title = escapeXml(movie?.title ?? 'Nexo Filmes');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750" viewBox="0 0 500 750"><rect width="500" height="750" fill="${color}"/><text x="250" y="375" fill="#fff" font-family="system-ui,sans-serif" font-size="34" text-anchor="middle">${title.slice(0, 26)}</text><text x="250" y="700" fill="#fff" opacity="0.7" font-family="system-ui,sans-serif" font-size="22" text-anchor="middle">Nexo Filmes · demo</text></svg>`;
}

export function demoBackdropSvg(id: number): string {
  const color = POSTER_COLORS[id % POSTER_COLORS.length] ?? '#333';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><defs><radialGradient id="g" cx="0.7" cy="0.3" r="0.9"><stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="#0b0d12"/></radialGradient></defs><rect width="1280" height="720" fill="url(#g)"/><circle cx="900" cy="220" r="160" fill="#fff" opacity="0.06"/><circle cx="1050" cy="420" r="90" fill="#fff" opacity="0.05"/></svg>`;
}

export function demoProfileSvg(id: number): string {
  const color = POSTER_COLORS[id % POSTER_COLORS.length] ?? '#333';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="185" height="278" viewBox="0 0 185 278"><rect width="185" height="278" fill="${color}"/><circle cx="92" cy="105" r="45" fill="#fff" opacity="0.35"/><ellipse cx="92" cy="250" rx="80" ry="70" fill="#fff" opacity="0.35"/></svg>`;
}

/** SVG de demonstração a partir do nome do arquivo (`550.svg`, `backdrop-550.svg`, `profile-5500.svg`). */
export function demoImageSvg(file: string): string {
  const match = /^(?:(backdrop|profile)-)?(\d+)\.svg$/.exec(file);
  const id = Number(match?.[2] ?? 0);
  if (match?.[1] === 'backdrop') return demoBackdropSvg(id);
  if (match?.[1] === 'profile') return demoProfileSvg(id);
  return demoPosterSvg(id);
}
