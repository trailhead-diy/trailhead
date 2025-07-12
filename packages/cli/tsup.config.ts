import { defineConfig } from 'tsup';

export default defineConfig({
  // CLI-specific entry points only
  entry: {
    index: 'src/index.ts',
    'command/index': 'src/command/index.ts',
    'prompts/index': 'src/prompts/index.ts',
    'testing/index': 'src/testing/index.ts',
    'utils/index': 'src/utils/index.ts',
    'progress/index': 'src/progress/index.ts',
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
    'zod',
    '@inquirer/prompts',
    'listr2',
    'p-retry',
    'cli-progress',
    'yocto-spinner',
    'chokidar',
  ],
});
