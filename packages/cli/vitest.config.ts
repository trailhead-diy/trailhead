import { createVitestConfig } from '@repo/vitest-config';
import { defineConfig, mergeConfig } from 'vitest/config';
import path from 'path';

const baseConfig = createVitestConfig();

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
      'examples/**/*.test.ts',
      'examples/**/*.spec.ts',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@trailhead/core': path.resolve(__dirname, '../core/src'),
      '@trailhead/fs': path.resolve(__dirname, '../fs/src'),
      '@trailhead/validation': path.resolve(__dirname, '../validation/src'),
      '@trailhead/data': path.resolve(__dirname, '../data/src'),
      '@trailhead/formats': path.resolve(__dirname, '../formats/src'),
      '@trailhead/streams': path.resolve(__dirname, '../streams/src'),
      '@trailhead/watcher': path.resolve(__dirname, '../watcher/src'),
      '@trailhead/workflows': path.resolve(__dirname, '../workflows/src'),
      '@trailhead/config': path.resolve(__dirname, '../config/src'),
      '@trailhead/git': path.resolve(__dirname, '../git/src'),
    },
  },
});

export default mergeConfig(baseConfig, packageSpecificConfig);
