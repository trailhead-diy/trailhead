import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'core/index': 'src/core/index.ts',
    'status/index': 'src/status/index.ts',
    'diff/index': 'src/diff/index.ts',
    'commands/index': 'src/commands/index.ts',
    'testing/index': 'src/testing/index.ts',
  },
  format: ['esm'],
  dts: false, // TypeScript declarations generated separately
  splitting: false,
  sourcemap: false,
  clean: true,
  minify: false,
  target: 'node18',
  external: ['@esteban-url/core', '@esteban-url/fs'],
})
