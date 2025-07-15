/**
 * Console utilities for tests that need console access
 *
 * By default, all console methods are mocked to keep test output clean.
 * Use these utilities when tests need to verify console behavior or output.
 */

import { expect } from 'vitest'

/**
 * Wrapper function for tests that need console access
 * Temporarily restores console methods, then re-mocks them after test execution
 *
 * @param testFn - Test function that needs console access
 * @returns Wrapped test function
 *
 * @example
 * ```typescript
 * it('should log accessibility warnings', withConsole(async () => {
 *   // Console.log calls will work normally here
 *   const result = checkContrast(color1, color2)
 *   expectConsoleLog('contrast warning')
 * }))
 * ```
 */
export const withConsole = (testFn: () => void | Promise<void>) => {
  return async () => {
    // Restore console methods
    globalThis.__restoreConsole()

    try {
      await testFn()
    } finally {
      // Re-mock console methods to keep other tests clean
      globalThis.__mockConsole()
    }
  }
}

/**
 * Wrapper function for tests that need to spy on console methods
 * Creates fresh spies for console methods during test execution
 *
 * @param testFn - Test function that needs to spy on console
 * @returns Wrapped test function
 *
 * @example
 * ```typescript
 * it('should handle errors', withConsoleSpy(async () => {
 *   await failingOperation()
 *   expect(console.error).toHaveBeenCalledWith(expect.stringMatching(/error/))
 * }))
 * ```
 */
export const withConsoleSpy = (testFn: () => void | Promise<void>) => {
  return async () => {
    const { vi } = await import('vitest')

    // Create fresh spies for console methods
    const consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
    }

    try {
      await testFn()
    } finally {
      // Restore spies
      consoleSpy.log.mockRestore()
      consoleSpy.warn.mockRestore()
      consoleSpy.error.mockRestore()
      consoleSpy.info.mockRestore()

      // Re-mock console methods for global setup
      globalThis.__mockConsole()
    }
  }
}

/**
 * Asserts that console.log was called with a message matching the given pattern
 *
 * @param message - String or RegExp to match against console.log calls
 *
 * @example
 * ```typescript
 * expectConsoleLog('Transform completed')
 * expectConsoleLog(/contrast is \d+\.\d+/)
 * ```
 */
export const expectConsoleLog = (message: string | RegExp) => {
  return expect(console.log).toHaveBeenCalledWith(expect.stringMatching(message))
}

/**
 * Asserts that console.warn was called with a message matching the given pattern
 */
export const expectConsoleWarn = (message: string | RegExp) => {
  return expect(console.warn).toHaveBeenCalledWith(expect.stringMatching(message))
}

/**
 * Asserts that console.error was called with a message matching the given pattern
 */
export const expectConsoleError = (message: string | RegExp) => {
  return expect(console.error).toHaveBeenCalledWith(expect.stringMatching(message))
}

/**
 * Asserts that console.info was called with a message matching the given pattern
 */
export const expectConsoleInfo = (message: string | RegExp) => {
  return expect(console.info).toHaveBeenCalledWith(expect.stringMatching(message))
}

/**
 * Temporarily enables console output for debugging purposes
 * Useful for development and troubleshooting
 *
 * @example
 * ```typescript
 * it('debug test', () => {
 *   withDebugConsole(() => {
 *     console.log('This will be visible in test output')
 *   })
 * })
 * ```
 */
export const withDebugConsole = (fn: () => void | Promise<void>) => {
  return withConsole(fn)
}

/**
 * Gets the original console methods (before mocking)
 * Useful for manual console restoration in complex scenarios
 */
export const getOriginalConsole = () => {
  return globalThis.__originalConsole
}

/**
 * Checks if console methods are currently mocked
 * Useful for conditional logic in tests
 */
export const isConsoleMocked = () => {
  return typeof console.log === 'function' && 'mock' in console.log
}
