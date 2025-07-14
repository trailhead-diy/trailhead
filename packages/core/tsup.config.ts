import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'errors/index': 'src/errors/index.ts',
    'functional/index': 'src/functional/index.ts',
  },
  format: ['esm'],
  dts: false, // We use tsc for declarations
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  minify: false,
  target: 'node18',
  platform: 'node',
})
