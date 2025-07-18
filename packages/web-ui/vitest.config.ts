import { createVitestConfig } from '@repo/vitest-config'
import { defineConfig, mergeConfig } from 'vitest/config'
import path from 'path'

const baseConfig = createVitestConfig({
  environment: 'jsdom',
  additionalAliases: {
    '@': path.resolve(__dirname, './src'),
    '@scripts': path.resolve(__dirname, './scripts'),
    '@tests': path.resolve(__dirname, './tests'),
    '@esteban-url/core': path.resolve(__dirname, '../core/src'),
    '@esteban-url/fs': path.resolve(__dirname, '../fs/src'),
    '@esteban-url/cli': path.resolve(__dirname, '../cli/src'),
    '@esteban-url/config': path.resolve(__dirname, '../config/src'),
    '@esteban-url/data': path.resolve(__dirname, '../data/src'),
    '@esteban-url/validation': path.resolve(__dirname, '../validation/src'),
    // Subpath exports
    '@esteban-url/cli/core': path.resolve(__dirname, '../cli/src/core'),
    '@esteban-url/cli/filesystem': path.resolve(__dirname, '../cli/src/filesystem'),
    '@esteban-url/cli/config': path.resolve(__dirname, '../cli/src/config'),
    '@esteban-url/core/testing': path.resolve(__dirname, '../core/src/testing'),
    '@esteban-url/fs/testing': path.resolve(__dirname, '../fs/src/testing'),
  },
  useTsconfigPaths: true,
})

const packageSpecificConfig = defineConfig({
  test: {
    include: [
      './tests/**/*.test.{ts,tsx}',
      './src/**/__tests__/**/*.test.{ts,tsx}',
      './src/**/*.test.{ts,tsx}',
    ],
    exclude: ['./tests/scripts/install/future/**/*'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['{scripts,src}/**/**/*.{ts,tsx}'],
      exclude: ['**/index.ts', '**/types.ts', '**/*.config.ts', '**/*.setup.ts', '**/*.d.ts'],
    },
  },
})

export default mergeConfig(baseConfig, packageSpecificConfig)
