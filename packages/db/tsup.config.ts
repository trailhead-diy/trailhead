import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'core/index': 'src/core/index.ts',
    'adapters/index': 'src/adapters/index.ts',
    'query/index': 'src/query/index.ts',
    'schema/index': 'src/schema/index.ts',
    'testing/index': 'src/testing/index.ts',
  },
  format: ['esm'],
  dts: false, // TypeScript declarations generated separately
  splitting: false,
  sourcemap: false,
  clean: true,
  minify: false,
  target: 'node18',
  external: ['@esteban-url/core', '@esteban-url/validation', '@esteban-url/fs'],
})
