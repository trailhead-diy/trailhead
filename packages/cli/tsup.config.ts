import { defineConfig } from 'tsup'
import { tsupProfiles } from '@repo/tsup-config/shared'

export default defineConfig(
  tsupProfiles.node({
    // CLI-specific entry points
    entry: {
      index: 'src/index.ts',
      'command/index': 'src/command/index.ts',
      'prompts/index': 'src/prompts/index.ts',
      'testing/index': 'src/testing/index.ts',
      'utils/index': 'src/utils/index.ts',
      'progress/index': 'src/progress/index.ts',
    },
    // Generate TypeScript declarations
    dts: true,
    // Split code for better caching
    splitting: true,
    // Enable minification in production
    minify: process.env.NODE_ENV === 'production',
    // External dependencies specific to CLI
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
  })
)
