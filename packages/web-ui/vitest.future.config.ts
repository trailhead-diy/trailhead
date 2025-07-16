import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['./tests/scripts/install/future/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    clearMocks: true,
    restoreMocks: true,
    isolate: true,
    // Memory optimization settings
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
        maxThreads: 1,
        minThreads: 1,
      },
    },
    // Increase test timeout for future tests (may be slower)
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@scripts': path.resolve(__dirname, './scripts'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
})
