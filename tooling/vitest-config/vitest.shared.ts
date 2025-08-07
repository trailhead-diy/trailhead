/**
 * @module vitest-config
 * @description Shared Vitest configuration for Trailhead monorepo packages
 *
 * Provides a centralized Vitest configuration factory that handles:
 * - TypeScript path mapping and module resolution
 * - Monorepo package aliasing for testing
 * - Environment configuration (Node.js or jsdom)
 * - Plugin management and setup files
 *
 * @since 1.0.0
 */

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

/**
 * Creates a Vitest configuration tailored for monorepo packages
 *
 * Generates a Vitest configuration with proper module resolution for
 * internal packages, TypeScript path mapping, and environment setup.
 * Automatically detects the monorepo root and maps package imports
 * to their source files for accurate testing.
 *
 * @param options - Configuration options
 * @returns Vitest configuration object
 *
 * @example
 * ```typescript
 * // In a package's vitest.config.ts
 * import { createVitestConfig } from '@repo/vitest-config'
 *
 * export default createVitestConfig({
 *   environment: 'node',
 *   setupFiles: ['./test/setup.ts']
 * })
 *
 * // For browser/DOM testing
 * export default createVitestConfig({
 *   environment: 'jsdom',
 *   additionalAliases: {
 *     '@/components': './src/components'
 *   }
 * })
 * ```
 */
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
  // Account for both source (tooling/vitest-config/) and built (tooling/vitest-config/dist/) contexts
  const isBuilt = __dirname.includes('/dist/')
  const monorepoRoot = isBuilt
    ? resolve(__dirname, '../../..') // from dist: tooling/vitest-config/dist -> root
    : resolve(__dirname, '../..') // from src: tooling/vitest-config -> root
  const packagesDir = resolve(monorepoRoot, 'packages')

  return defineConfig({
    plugins,
    resolve: {
      alias: {
        // Map internal packages to their source files during tests
        '@esteban-url/core/utils': resolve(packagesDir, 'core/src/utils/index.ts'),
        '@esteban-url/core/errors': resolve(packagesDir, 'core/src/errors/index.ts'),
        '@esteban-url/core/functional': resolve(packagesDir, 'core/src/functional/index.ts'),
        '@esteban-url/core/testing': resolve(packagesDir, 'core/src/testing/index.ts'),
        '@esteban-url/core': resolve(packagesDir, 'core/src/index.ts'),
        '@esteban-url/validation/testing': resolve(packagesDir, 'validation/src/testing/index.ts'),
        '@esteban-url/validation': resolve(packagesDir, 'validation/src/index.ts'),
        '@esteban-url/config/testing': resolve(packagesDir, 'config/src/testing/index.ts'),
        '@esteban-url/config': resolve(packagesDir, 'config/src/index.ts'),
        '@esteban-url/fs/testing': resolve(packagesDir, 'fs/src/testing/index.ts'),
        '@esteban-url/fs/utils': resolve(packagesDir, 'fs/src/utils/index.ts'),
        '@esteban-url/fs': resolve(packagesDir, 'fs/src/index.ts'),
        '@esteban-url/data': resolve(packagesDir, 'data/src/index.ts'),
        '@esteban-url/cli/testing': resolve(packagesDir, 'cli/src/testing/index.ts'),
        '@esteban-url/cli/utils': resolve(packagesDir, 'cli/src/utils/index.ts'),
        '@esteban-url/cli': resolve(packagesDir, 'cli/src/index.ts'),
        ...additionalAliases,
      },
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
      coverage: {
        enabled: process.env.COVERAGE === 'true',
        provider: 'v8',
        reporter: ['text', 'json-summary', 'html'],
        reportsDirectory: './coverage',
        thresholds:
          process.env.COVERAGE_ENFORCE === 'true'
            ? {
                lines: 70,
                functions: 70,
                branches: 60,
                statements: 70,
              }
            : undefined,
        exclude: [
          '**/*.test.ts',
          '**/*.test.tsx',
          '**/*.spec.ts',
          '**/*.spec.tsx',
          '**/testing/**',
          '**/*.d.ts',
          '**/bin/**',
          '**/dist/**',
          '**/node_modules/**',
          '**/coverage/**',
          '**/*.config.ts',
          '**/*.config.js',
          '**/types.ts',
          '**/index.ts',
        ],
      },
    },
  })
}
