import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@esteban-url/testing',
    environment: 'node',
    globals: true,
  },
});
