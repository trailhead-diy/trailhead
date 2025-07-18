import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'errors/index': 'src/errors/index.ts',
    'functional/index': 'src/functional/index.ts',
    'testing/index': 'src/testing/index.ts',
    'utils/index': 'src/utils/index.ts',
  },
  format: ['esm'],
  dts: false, // Using tsc due to chalk re-export issue
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  minify: false,
  target: 'node18',
  platform: 'node',
})
