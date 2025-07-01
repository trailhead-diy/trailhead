import { createVitestConfig } from '@repo/vitest-config'
import { defineConfig, mergeConfig } from 'vitest/config'
import path from 'path'

const baseConfig = createVitestConfig()

const packageSpecificConfig = defineConfig({
  test: {
    include: ['./tests/**/*.test.{ts,tsx}'],
    exclude: [
      './tests/scripts/install/future/**/*',
    ],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary'],
      include: ['{scripts,src}/**/**/*.{ts,tsx}'],
      exclude: [
        '**/index.ts',
        '**/types.ts',
        '**/*.config.ts',
        '**/*.setup.ts',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@scripts': path.resolve(__dirname, './scripts'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
})

export default mergeConfig(baseConfig, packageSpecificConfig)
