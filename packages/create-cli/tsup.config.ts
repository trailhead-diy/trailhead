import { defineConfig } from 'tsup'
import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import fg from 'fast-glob'

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
    options.conditions = ['node']
  },
  onSuccess: async () => {
    // Copy templates directory to dist
    const templateFiles = await fg('templates/**/*', {
      dot: true,
      onlyFiles: true,
    })

    for (const file of templateFiles) {
      const destPath = join('dist', file)
      const destDir = dirname(destPath)

      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true })
      }

      copyFileSync(file, destPath)
    }

    console.log(`Copied ${templateFiles.length} template files to dist/`)
  },
})
