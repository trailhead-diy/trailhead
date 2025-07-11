import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'detection/index': 'src/detection/index.ts',
    'mime/index': 'src/mime/index.ts',
    'conversion/index': 'src/conversion/index.ts',
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
});
