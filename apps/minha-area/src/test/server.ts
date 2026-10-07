import { tmdbHandlers } from '@nexo/tmdb/testing';
import { setupServer } from 'msw/node';

export const server = setupServer(...tmdbHandlers);
