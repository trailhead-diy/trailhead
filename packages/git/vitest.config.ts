import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@trailhead/git',
    environment: 'node',
    globals: true,
  },
});
