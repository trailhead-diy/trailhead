import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false, // We generate these separately with tsc
  sourcemap: true,
  clean: true,
  splitting: false,
  minify: false,
  bundle: true,
  external: [
    '@esteban-url/trailhead-cli',
    '@inquirer/prompts',
    'handlebars',
    'fast-glob',
    'execa',
    'fs-extra',
    'chalk',
    'ora',
  ],
  target: 'node18',
  platform: 'node',
  outDir: 'dist',
  treeshake: true,
  esbuildOptions: (options) => {
    options.conditions = ['node'];
  },
});
