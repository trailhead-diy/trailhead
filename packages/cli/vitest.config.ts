import { createVitestConfig } from '@repo/vitest-config'
import { defineConfig, mergeConfig } from 'vitest/config'
import path from 'path'

const baseConfig = createVitestConfig({
  environment: 'node',
  additionalAliases: {
    '@': path.resolve(__dirname, './src'),
    '@esteban-url/core': path.resolve(__dirname, '../core/src'),
    '@esteban-url/fs': path.resolve(__dirname, '../fs/src'),
    '@esteban-url/config': path.resolve(__dirname, '../config/src'),
    '@esteban-url/data': path.resolve(__dirname, '../data/src'),
    '@esteban-url/validation': path.resolve(__dirname, '../validation/src'),
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
    include: [
      'src/**/*.test.ts',
      'src/**/*.spec.ts',
      'tests/**/*.test.ts',
      'tests/**/*.spec.ts',
      'examples/**/*.test.ts',
      'examples/**/*.spec.ts',
    ],
  },
})

export default mergeConfig(baseConfig, packageSpecificConfig)
