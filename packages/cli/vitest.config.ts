import { createVitestConfig } from '@repo/vitest-config'
import { defineConfig, mergeConfig } from 'vitest/config'
import path from 'path'

const baseConfig = createVitestConfig({
  environment: 'node',
  additionalAliases: {
    '@': path.resolve(__dirname, './src'),
  },
  useTsconfigPaths: true,
})

const packageSpecificConfig = defineConfig({
  test: {
    coverage: {
      exclude: [
        'node_modules',
        'dist',
        '**/*.config.ts',
        '**/*.config.js',
        '**/types.ts',
        '**/index.ts',
      ],
    },
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'tests/**/*.test.ts', 'tests/**/*.spec.ts'],
  },
})

export default mergeConfig(baseConfig, packageSpecificConfig)
