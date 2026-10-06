import { tmdbHandlers } from '@nexo/tmdb/testing';
import { setupServer } from 'msw/node';

/** TMDB simulada para os testes: nenhum teste chama a API real. */
export const server = setupServer(...tmdbHandlers);
