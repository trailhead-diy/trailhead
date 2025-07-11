import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@trailhead/testing',
    environment: 'node',
    globals: true,
  },
});
