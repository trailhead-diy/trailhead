import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

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
  const plugins = useTsconfigPaths ? [tsconfigPaths()] : []

  return defineConfig({
    plugins,
    resolve: {
      alias: additionalAliases,
      // Ensure we use source files in tests, not dist
      conditions: ['development', 'module'],
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
