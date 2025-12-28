import { defineConfig } from 'tsup'
import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import fg from 'fast-glob'
import { tsupProfiles } from '@repo/tsup-config/shared'

const baseConfig = tsupProfiles.node({
  entry: {
    index: 'src/index.ts',
  },
  // Disable DTS for now - having issues with workspace dependencies
  dts: false,
  bundle: true,
  external: [
    '@trailhead/cli',
    '@trailhead/core',
    '@trailhead/trailhead-cli',
    '@inquirer/prompts',
    'handlebars',
    'fast-glob',
    'execa',
    'fs-extra',
    'chalk',
    'ora',
  ],
  esbuildOptions: (options) => {
    options.conditions = ['node']
  },
})

export default defineConfig({
  ...baseConfig,
  async onSuccess() {
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
