import { defineConfig } from 'tsup';

export default defineConfig({
  // Multiple entry points for each subpath export
  entry: {
    index: 'src/index.ts',
    'core/index': 'src/core/index.ts',
    'command/index': 'src/command/index.ts',
    'filesystem/index': 'src/filesystem/index.ts',
    'config/index': 'src/config/index.ts',
    'prompts/index': 'src/prompts/index.ts',
    'testing/index': 'src/testing/index.ts',
    'utils/index': 'src/utils/index.ts',
  },
  // ESM-only output
  format: ['esm'],
  // Generate TypeScript declarations using tsc
  dts: false, // We'll use tsc separately for declarations
  // Don't clean output directory - let tsc handle declarations
  clean: false,
  // Enable minification in production
  minify: process.env.NODE_ENV === 'production',
  // Generate source maps for debugging
  sourcemap: true,
  // Enable tree-shaking
  treeshake: true,
  // Split code for better caching
  splitting: true,
  // Target modern environments
  target: 'node18',
  // External dependencies
  external: [
    'chalk',
    'commander',
    'cosmiconfig',
    'glob',
    'ora',
    'zod',
    '@inquirer/prompts',
  ],
});