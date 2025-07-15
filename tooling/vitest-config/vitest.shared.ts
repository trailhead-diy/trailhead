import { defineConfig } from 'vitest/config'

export interface VitestConfigOptions {
  environment?: 'node' | 'jsdom'
  coverage?: {
    enabled?: boolean
    threshold?: number
  }
}

export const createVitestConfig = (options: VitestConfigOptions = {}) => {
  const { environment = 'node', coverage = { enabled: true, threshold: 80 } } = options

  return defineConfig({
    test: {
      globals: true,
      environment,
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
      coverage: coverage.enabled
        ? {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            thresholds: {
              global: {
                lines: coverage.threshold,
                functions: coverage.threshold,
                branches: coverage.threshold,
                statements: coverage.threshold,
              },
            },
            exclude: [
              'node_modules',
              'dist',
              'coverage',
              '**/*.config.ts',
              '**/*.config.js',
              'tests/setup',
              '**/testing/**',
            ],
          }
        : undefined,
    },
  })
}

/**
 * Cross-cutting test utilities that don't belong to any specific domain
 * For Result matchers, use @esteban-url/core/testing instead
 */
export const testPatterns = {
  /**
   * Create a timeout configuration for tests
   */
  timeout: (ms: number) => ({ timeout: ms }),
  
  /**
   * Create a retry configuration for tests
   */
  retry: (count: number) => ({ retry: count }),
  
  /**
   * Conditional skip utility
   */
  skip: (condition: boolean) => condition,
  
  /**
   * Create a test description with consistent formatting
   */
  describe: (domain: string, feature: string) => `${domain}: ${feature}`,
}
