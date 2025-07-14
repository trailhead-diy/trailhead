import { createVitestConfig } from '@repo/vitest-config'
import { defineConfig, mergeConfig } from 'vitest/config'
import path from 'path'

const baseConfig = createVitestConfig()

const packageSpecificConfig = defineConfig({
  test: {
    environment: 'node',
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
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@esteban-url/core': path.resolve(__dirname, '../core/src'),
      '@esteban-url/fs': path.resolve(__dirname, '../fs/src'),
      '@esteban-url/validation': path.resolve(__dirname, '../validation/src'),
      '@esteban-url/data': path.resolve(__dirname, '../data/src'),
      '@esteban-url/formats': path.resolve(__dirname, '../formats/src'),
      '@esteban-url/streams': path.resolve(__dirname, '../streams/src'),
      '@esteban-url/watcher': path.resolve(__dirname, '../watcher/src'),
      '@esteban-url/workflows': path.resolve(__dirname, '../workflows/src'),
      '@esteban-url/config': path.resolve(__dirname, '../config/src'),
      '@esteban-url/git': path.resolve(__dirname, '../git/src'),
    },
  },
})

export default mergeConfig(baseConfig, packageSpecificConfig)
