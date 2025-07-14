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

// Result type matchers for testing
export const resultMatchers = {
  toBeOk: (received: any) => {
    const pass = received && typeof received === 'object' && received.isOk === true
    return {
      pass,
      message: () =>
        pass
          ? `expected ${JSON.stringify(received)} not to be Ok`
          : `expected ${JSON.stringify(received)} to be Ok`,
    }
  },
  toBeErr: (received: any) => {
    const pass = received && typeof received === 'object' && received.isErr === true
    return {
      pass,
      message: () =>
        pass
          ? `expected ${JSON.stringify(received)} not to be Err`
          : `expected ${JSON.stringify(received)} to be Err`,
    }
  },
  toBeOkWith: (received: any, expected: any) => {
    const pass =
      received &&
      typeof received === 'object' &&
      received.isOk === true &&
      JSON.stringify(received.value) === JSON.stringify(expected)
    return {
      pass,
      message: () =>
        pass
          ? `expected ${JSON.stringify(received)} not to be Ok with ${JSON.stringify(expected)}`
          : `expected ${JSON.stringify(received)} to be Ok with ${JSON.stringify(expected)}`,
    }
  },
  toBeErrWith: (received: any, expected: any) => {
    const pass =
      received &&
      typeof received === 'object' &&
      received.isErr === true &&
      JSON.stringify(received.error) === JSON.stringify(expected)
    return {
      pass,
      message: () =>
        pass
          ? `expected ${JSON.stringify(received)} not to be Err with ${JSON.stringify(expected)}`
          : `expected ${JSON.stringify(received)} to be Err with ${JSON.stringify(expected)}`,
    }
  },
}

/**
 * Setup Result matchers in test files
 * Call this in your test setup or individual test files
 */
export const setupResultMatchers = () => {
  // This function should be called in test setup files
  return resultMatchers
}
