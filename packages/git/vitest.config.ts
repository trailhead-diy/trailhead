import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@esteban-url/git',
    environment: 'node',
    globals: true,
  },
});
