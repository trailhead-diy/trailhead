import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@trailhead/db',
    environment: 'node',
    globals: true,
  },
});
