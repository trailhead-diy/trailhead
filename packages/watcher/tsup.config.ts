import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'events/index': 'src/events/index.ts',
    'patterns/index': 'src/patterns/index.ts',
    'filters/index': 'src/filters/index.ts',
    'testing/index': 'src/testing/index.ts',
  },
  format: ['esm'],
  dts: false, // We generate types separately with tsc
  sourcemap: true,
  clean: true,
  target: 'node18',
})
