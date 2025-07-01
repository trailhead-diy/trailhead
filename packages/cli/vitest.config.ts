import { createVitestConfig } from '@repo/vitest-config';
import { defineConfig, mergeConfig } from 'vitest/config';
import path from 'path';

const baseConfig = createVitestConfig();

const packageSpecificConfig = defineConfig({
  test: {
    environment: 'node',
    coverage: {
      reporter: ['text', 'json', 'html'],
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
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

export default mergeConfig(baseConfig, packageSpecificConfig);
