import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'core/index': 'src/core/operations.ts',
    'loaders/index': 'src/loaders/operations.ts',
    'validators/index': 'src/validators/operations.ts',
    'transformers/index': 'src/transformers/operations.ts',
    'testing/index': 'src/testing/index.ts',
  },
  format: ['esm'],
  dts: false, // Use tsc for declarations
  sourcemap: true,
  clean: true,
  splitting: true,
  treeshake: true,
  minify: false,
  target: 'node18',
  external: ['@esteban-url/core', '@esteban-url/validation', '@esteban-url/fs', '@esteban-url/cli'],
})
