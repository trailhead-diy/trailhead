import { createVitestConfig } from '@repo/vitest-config'
import { defineConfig, mergeConfig } from 'vitest/config'

const baseConfig = createVitestConfig({
  environment: 'node',
  useTsconfigPaths: true,
})

const packageSpecificConfig = defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'test-temp*', 'temp-*', '**/test-temp*/**', '**/temp-*/**'],
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.d.ts', 'src/testing/**/*'],
    },
  },
})

export default mergeConfig(baseConfig, packageSpecificConfig)
