import { createVitestConfig } from '@repo/vitest-config'
import { mergeConfig } from 'vitest/config'

export default mergeConfig(
  createVitestConfig({
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
  }),
  {
    test: {
      name: '@repo/dev-cli',
      testTimeout: 30000, // Longer timeout for integration tests
      hookTimeout: 30000, // Longer timeout for setup/teardown
      env: {
        NODE_ENV: 'test',
      },
    },
  }
)
