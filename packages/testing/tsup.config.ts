import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'core/index': 'src/core/index.ts',
    'mocks/index': 'src/mocks/index.ts',
    'fixtures/index': 'src/fixtures/index.ts',
    'runners/index': 'src/runners/index.ts',
  },
  format: ['esm'],
  dts: false, // TypeScript declarations generated separately
  splitting: false,
  sourcemap: false,
  clean: true,
  minify: false,
  target: 'node18',
  external: ['@esteban-url/core', '@esteban-url/fs'],
});
