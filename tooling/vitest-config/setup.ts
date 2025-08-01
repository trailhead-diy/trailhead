/**
 * Shared test setup for all packages
 * This file provides consistent test environment setup across the monorepo
 */

import { beforeEach, afterEach, vi } from 'vitest'

// ========================================
// Global Test Setup
// ========================================

/**
 * Setup Result matchers for all tests
 */
export function setupResultMatchers() {
  try {
    const { resultMatchers } = require('@esteban-url/core/testing')
    if (globalThis.expect && globalThis.expect.extend) {
      globalThis.expect.extend(resultMatchers)
    }
  } catch {
    // Silently fail if core testing is not available
    // This allows packages to use setup without core dependency
  }
}

/**
 * Setup common test environment
 */
export function setupTestEnvironment() {
  // Mock console methods to reduce noise in tests
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })
}

/**
 * Setup temporary directory cleanup
 */
export function setupTempDirCleanup() {
  const tempDirs: string[] = []

  beforeEach(() => {
    tempDirs.length = 0
  })

  afterEach(async () => {
    // Clean up temporary directories
    for (const dir of tempDirs) {
      try {
        const { cleanup } = require('@esteban-url/fs/testing')
        await cleanup(dir)
      } catch {
        // Silently fail if fs testing is not available
      }
    }
  })

  return {
    registerTempDir: (dir: string) => {
      tempDirs.push(dir)
    },
  }
}

/**
 * Setup mock timers
 */
export function setupMockTimers() {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })
}

/**
 * Setup performance monitoring
 */
export function setupPerformanceMonitoring() {
  const performanceMarks: Array<{ name: string; start: number; end?: number }> = []

  return {
    startMark: (name: string) => {
      performanceMarks.push({ name, start: performance.now() })
    },
    endMark: (name: string) => {
      const mark = performanceMarks.find((m) => m.name === name && !m.end)
      if (mark) {
        mark.end = performance.now()
      }
    },
    getMark: (name: string) => {
      const mark = performanceMarks.find((m) => m.name === name)
      if (mark && mark.end) {
        return mark.end - mark.start
      }
      return null
    },
    clearMarks: () => {
      performanceMarks.length = 0
    },
  }
}

// ========================================
// Standardized Test Patterns
// ========================================

/**
 * Standard test patterns for consistent testing
 */
export const standardTestPatterns = {
  /**
   * Test a Result-returning function for success case
   */
  testResultSuccess: async <T>(
    fn: () => Promise<any> | any,
    expectedValue?: T,
    description?: string
  ) => {
    const testDesc = description || 'should return successful result'

    return {
      description: testDesc,
      test: async () => {
        const result = await fn()
        expect(result).toBeOk()
        if (expectedValue !== undefined) {
          expect(result).toHaveValue(expectedValue)
        }
      },
    }
  },

  /**
   * Test a Result-returning function for error case
   */
  testResultError: async (
    fn: () => Promise<any> | any,
    expectedErrorCode?: string,
    description?: string
  ) => {
    const testDesc = description || 'should return error result'

    return {
      description: testDesc,
      test: async () => {
        const result = await fn()
        expect(result).toBeErr()
        if (expectedErrorCode) {
          expect(result).toHaveErrorCode(expectedErrorCode)
        }
      },
    }
  },

  /**
   * Test async operation with timeout
   */
  testAsyncOperation: (fn: () => Promise<any>, timeout: number = 5000, description?: string) => {
    const testDesc = description || 'should complete within timeout'

    return {
      description: testDesc,
      test: async () => {
        const promise = fn()
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Operation timed out')), timeout)
        })

        await expect(Promise.race([promise, timeoutPromise])).resolves.not.toThrow()
      },
    }
  },

  /**
   * Test error handling with specific error types
   */
  testErrorHandling: (fn: () => Promise<any> | any, errorType: string, description?: string) => {
    const testDesc = description || `should handle ${errorType} errors`

    return {
      description: testDesc,
      test: async () => {
        try {
          await fn()
          throw new Error('Expected function to throw')
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
          expect(error.message).toContain(errorType)
        }
      },
    }
  },
}

// ========================================
// Test Data Generators
// ========================================

/**
 * Generate test data for common scenarios
 */
export const testDataGenerators = {
  /**
   * Generate random string
   */
  randomString: (length: number = 10) => {
    return Math.random()
      .toString(36)
      .substring(2, length + 2)
  },

  /**
   * Generate random number
   */
  randomNumber: (min: number = 0, max: number = 100) => {
    return Math.floor(Math.random() * (max - min + 1)) + min
  },

  /**
   * Generate random boolean
   */
  randomBoolean: () => {
    return Math.random() > 0.5
  },

  /**
   * Generate random array
   */
  randomArray: <T>(generator: () => T, length: number = 5) => {
    return Array.from({ length }, generator)
  },

  /**
   * Generate random object
   */
  randomObject: (properties: Record<string, () => any>) => {
    const obj: Record<string, any> = {}
    for (const [key, generator] of Object.entries(properties)) {
      obj[key] = generator()
    }
    return obj
  },

  /**
   * Generate user-like data
   */
  randomUser: () => ({
    id: testDataGenerators.randomNumber(1, 1000),
    name: `User ${testDataGenerators.randomString(5)}`,
    email: `${testDataGenerators.randomString(8)}@example.com`,
    active: testDataGenerators.randomBoolean(),
    created: new Date().toISOString(),
  }),

  /**
   * Generate file-like data
   */
  randomFile: () => ({
    path: `/${testDataGenerators.randomString(8)}.txt`,
    content: testDataGenerators.randomString(100),
    size: testDataGenerators.randomNumber(1, 1000),
    modified: new Date().toISOString(),
  }),
}

// ========================================
// Test Utilities
// ========================================

/**
 * Utility to run tests with retries
 */
export function withRetries<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 100
): Promise<T> {
  return new Promise((resolve, reject) => {
    let attempts = 0

    const attempt = async () => {
      try {
        const result = await fn()
        resolve(result)
      } catch (error) {
        attempts++
        if (attempts >= maxRetries) {
          reject(error)
        } else {
          setTimeout(attempt, delay)
        }
      }
    }

    attempt()
  })
}

/**
 * Utility to create test timeout
 */
export function createTestTimeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Test timed out after ${ms}ms`))
    }, ms)
  })
}

/**
 * Utility to wait for condition
 */
export function waitForCondition(
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now()

    const check = () => {
      if (condition()) {
        resolve()
      } else if (Date.now() - start > timeout) {
        reject(new Error('Condition not met within timeout'))
      } else {
        setTimeout(check, interval)
      }
    }

    check()
  })
}

// ========================================
// Export All Setup Functions
// ========================================

/**
 * Complete test setup for a package
 */
export function setupPackageTests(
  options: {
    resultMatchers?: boolean
    tempDirCleanup?: boolean
    mockTimers?: boolean
    performanceMonitoring?: boolean
    environment?: boolean
  } = {}
) {
  const {
    resultMatchers = true,
    tempDirCleanup = true,
    mockTimers = false,
    performanceMonitoring = false,
    environment = true,
  } = options

  const setupResults: any = {}

  if (resultMatchers) {
    setupResultMatchers()
  }

  if (environment) {
    setupTestEnvironment()
  }

  if (tempDirCleanup) {
    setupResults.tempDir = setupTempDirCleanup()
  }

  if (mockTimers) {
    setupMockTimers()
  }

  if (performanceMonitoring) {
    setupResults.performance = setupPerformanceMonitoring()
  }

  return setupResults
}

/**
 * Default setup for most packages
 */
export function setupDefaultTests() {
  return setupPackageTests({
    resultMatchers: true,
    tempDirCleanup: true,
    mockTimers: false,
    performanceMonitoring: false,
    environment: true,
  })
}

/**
 * Setup for CLI packages
 */
export function setupCLITests() {
  return setupPackageTests({
    resultMatchers: true,
    tempDirCleanup: true,
    mockTimers: true,
    performanceMonitoring: true,
    environment: true,
  })
}

/**
 * Setup for web packages
 */
export function setupWebTests() {
  return setupPackageTests({
    resultMatchers: true,
    tempDirCleanup: false,
    mockTimers: false,
    performanceMonitoring: false,
    environment: true,
  })
}

/**
 * Setup for performance tests
 */
export function setupPerformanceTests() {
  return setupPackageTests({
    resultMatchers: false,
    tempDirCleanup: false,
    mockTimers: false,
    performanceMonitoring: true,
    environment: false,
  })
}

// Export everything for easy import
export {
  setupResultMatchers,
  setupTestEnvironment,
  setupTempDirCleanup,
  setupMockTimers,
  setupPerformanceMonitoring,
  withRetries,
  createTestTimeout,
  waitForCondition,
}
