import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'core/index': 'src/core/index.ts',
    'steps/index': 'src/steps/index.ts',
    'execution/index': 'src/execution/index.ts',
    'state/index': 'src/state/index.ts',
  },
  format: ['esm'],
  dts: false, // Use tsc for declarations
  sourcemap: true,
  clean: true,
  splitting: true,
  treeshake: true,
  minify: false,
  target: 'node18',
});
