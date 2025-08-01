import { defineConfig } from 'vitest/config'
import type { PluginOption } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

export interface VitestConfigOptions {
  environment?: 'node' | 'jsdom'
  setupFiles?: string[]
  /**
   * Additional package aliases to resolve
   * @example { '@my-org/package': '../package/src' }
   */
  additionalAliases?: Record<string, string>
  /**
   * Whether to use vite-tsconfig-paths plugin for module resolution
   * @default true
   */
  useTsconfigPaths?: boolean
}

export const createVitestConfig = (options: VitestConfigOptions = {}) => {
  const {
    environment = 'node',
    setupFiles = [],
    additionalAliases = {},
    useTsconfigPaths = true,
  } = options

  // Add vite-tsconfig-paths plugin if enabled
  const plugins: PluginOption[] = useTsconfigPaths ? [tsconfigPaths()] : []

  // Find monorepo root (where pnpm-workspace.yaml is)
  const __dirname = fileURLToPath(new URL('.', import.meta.url))
  const monorepoRoot = resolve(__dirname, '../..')
  const packagesDir = resolve(monorepoRoot, 'packages')

  return defineConfig({
    plugins,
    resolve: {
      alias: {
        // Only add user-provided aliases, let pnpm workspace handle @esteban-url packages
        ...additionalAliases,
      },
      // Use standard module resolution
      conditions: ['import', 'module', 'default'],
    },
    test: {
      globals: true,
      environment,
      setupFiles,
      environmentOptions:
        environment === 'jsdom'
          ? {
              jsdom: {
                resources: 'usable',
                runScripts: 'dangerously',
                pretendToBeVisual: true,
              },
            }
          : undefined,
    },
  })
}
