import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/core/index.ts',
    'src/graph/index.ts',
    'src/grouping/index.ts',
    'src/analysis/index.ts',
    'src/testing/index.ts',
  ],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  splitting: false,
  treeshake: true,
  external: [
    '@esteban-url/core',
    '@esteban-url/fs',
    '@esteban-url/git',
    'dependency-cruiser',
    'tree-sitter',
    'tree-sitter-typescript',
  ],
})
