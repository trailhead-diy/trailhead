import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@esteban-url/db',
    environment: 'node',
    globals: true,
  },
});
