import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: '@repo/dev-cli',
    testTimeout: 30000, // Longer timeout for integration tests
    hookTimeout: 30000, // Longer timeout for setup/teardown
    setupFiles: ['./tests/setup.ts'],
    env: {
      NODE_ENV: 'test',
    },
    globals: true,
    environment: 'node',
  },
})
