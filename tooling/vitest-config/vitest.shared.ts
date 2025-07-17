import { defineConfig } from 'vitest/config'

export interface VitestConfigOptions {
  environment?: 'node' | 'jsdom'
  coverage?: {
    enabled?: boolean
    threshold?: number
    outputDirectory?: string
  }
  setupFiles?: string[]
  testTimeout?: number
  hooks?: {
    beforeEach?: string[]
    afterEach?: string[]
  }
  reporters?: ('verbose' | 'dot' | 'json' | 'html' | 'junit')[]
  passWithNoTests?: boolean
}

export const createVitestConfig = (options: VitestConfigOptions = {}) => {
  const {
    environment = 'node',
    coverage = { enabled: true, threshold: 80 },
    setupFiles = [],
    testTimeout = 10000,
    hooks = {},
    reporters = ['verbose'],
    passWithNoTests = false,
  } = options

  return defineConfig({
    test: {
      globals: true,
      environment,
      setupFiles,
      testTimeout,
      passWithNoTests,
      reporter: reporters,
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
            reportsDirectory: coverage.outputDirectory || 'coverage',
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
              '**/*.test.ts',
              '**/*.spec.ts',
              '**/mocks/**',
              '**/fixtures/**',
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

  /**
   * Create test group with consistent naming
   */
  group: (packageName: string, feature: string) => `${packageName}: ${feature}`,

  /**
   * Standardized test descriptions for common patterns
   */
  descriptions: {
    unit: (feature: string) => `Unit Tests: ${feature}`,
    integration: (feature: string) => `Integration Tests: ${feature}`,
    e2e: (feature: string) => `E2E Tests: ${feature}`,
    performance: (feature: string) => `Performance Tests: ${feature}`,
    regression: (feature: string) => `Regression Tests: ${feature}`,
  },
}

/**
 * Predefined configurations for common testing scenarios
 */
export const testingProfiles = {
  /**
   * Node.js package testing with standard coverage
   */
  node: (overrides: Partial<VitestConfigOptions> = {}) =>
    createVitestConfig({
      environment: 'node',
      coverage: { enabled: true, threshold: 80 },
      testTimeout: 10000,
      reporters: ['verbose'],
      passWithNoTests: false,
      ...overrides,
    }),

  /**
   * React/Web UI testing with jsdom
   */
  web: (overrides: Partial<VitestConfigOptions> = {}) =>
    createVitestConfig({
      environment: 'jsdom',
      coverage: { enabled: true, threshold: 85 },
      testTimeout: 15000,
      reporters: ['verbose'],
      passWithNoTests: false,
      ...overrides,
    }),

  /**
   * CLI testing with extended timeout
   */
  cli: (overrides: Partial<VitestConfigOptions> = {}) =>
    createVitestConfig({
      environment: 'node',
      coverage: { enabled: true, threshold: 80 },
      testTimeout: 30000,
      reporters: ['verbose'],
      passWithNoTests: false,
      ...overrides,
    }),

  /**
   * Performance testing with custom reporting
   */
  performance: (overrides: Partial<VitestConfigOptions> = {}) =>
    createVitestConfig({
      environment: 'node',
      coverage: { enabled: false },
      testTimeout: 60000,
      reporters: ['verbose', 'json'],
      passWithNoTests: true,
      ...overrides,
    }),

  /**
   * Integration testing with relaxed coverage
   */
  integration: (overrides: Partial<VitestConfigOptions> = {}) =>
    createVitestConfig({
      environment: 'node',
      coverage: { enabled: true, threshold: 70 },
      testTimeout: 20000,
      reporters: ['verbose'],
      passWithNoTests: false,
      ...overrides,
    }),
}

/**
 * Shared test setup utilities
 */
export const testSetup = {
  /**
   * Common test environment setup
   */
  beforeEach: {
    /**
     * Setup for Result type testing
     */
    resultMatchers: () => {
      const { setupResultMatchers } = require('@esteban-url/core/testing')
      setupResultMatchers()
    },

    /**
     * Setup for temporary directories
     */
    tempDir: () => {
      const { createTestTempDir } = require('@esteban-url/fs/testing')
      return createTestTempDir()
    },

    /**
     * Setup for mock timers
     */
    mockTimers: () => {
      vi.useFakeTimers()
      return () => vi.useRealTimers()
    },
  },

  /**
   * Common test cleanup utilities
   */
  afterEach: {
    /**
     * Cleanup temporary files
     */
    cleanup: (tempDir: string) => {
      const { cleanup } = require('@esteban-url/fs/testing')
      cleanup(tempDir)
    },

    /**
     * Restore mocks
     */
    restoreMocks: () => {
      vi.restoreAllMocks()
    },
  },
}

/**
 * Common test matchers and assertions
 */
export const testAssertions = {
  /**
   * Assert that a value is defined
   */
  toBeDefined: (value: any) => {
    if (value === undefined || value === null) {
      throw new Error('Expected value to be defined')
    }
  },

  /**
   * Assert that an array has specific length
   */
  toHaveLength: (array: any[], expectedLength: number) => {
    if (!Array.isArray(array)) {
      throw new Error('Expected an array')
    }
    if (array.length !== expectedLength) {
      throw new Error(`Expected array length ${expectedLength}, got ${array.length}`)
    }
  },

  /**
   * Assert that an object has specific properties
   */
  toHaveProperties: (obj: any, properties: string[]) => {
    for (const prop of properties) {
      if (!(prop in obj)) {
        throw new Error(`Expected object to have property '${prop}'`)
      }
    }
  },
}
