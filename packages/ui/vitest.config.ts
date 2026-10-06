import { sharedTestOptions } from '@nexo/config/vitest';
import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    ...sharedTestOptions,
    name: 'ui',
    environment: 'jsdom',
  },
});
