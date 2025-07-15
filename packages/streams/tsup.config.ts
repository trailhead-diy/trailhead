import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'readable/index': 'src/readable/index.ts',
    'writable/index': 'src/writable/index.ts',
    'transform/index': 'src/transform/index.ts',
    'duplex/index': 'src/duplex/index.ts',
    'testing/index': 'src/testing/index.ts',
  },
  format: ['esm'],
  dts: false, // We generate types separately with tsc
  sourcemap: true,
  clean: true,
  target: 'node18',
})
