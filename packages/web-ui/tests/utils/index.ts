/**
 * Test Utilities Index
 * 
 * Exports all cross-platform testing utilities for easy import.
 * Provides a single entry point for all testing helpers.
 */

// Cross-platform path utilities
export * from './cross-platform-paths.js'

// Mock filesystem utilities  
export * from './mock-filesystem.js'

// Re-export existing console utilities
export * from './console.js'

// Common test patterns and helpers
export const testPatterns = {
  /**
   * Common temporary directory naming pattern
   */
  tempDirName: (testName: string) => `test-${testName}-${Date.now()}`,
  
  /**
   * Common test timeout for filesystem operations
   */
  fileSystemTimeout: 10000,
  
  /**
   * Common test timeout for transform operations
   */
  transformTimeout: 30000,
  
  /**
   * Skip test in CI environments where external dependencies are missing
   */
  skipInCI: (condition: boolean) => condition && process.env.CI === 'true',
  
  /**
   * Platform-specific test skip conditions
   */
  skipOnWindows: process.platform === 'win32',
  skipOnUnix: process.platform !== 'win32',
}

/**
 * Test assertion helpers that work across platforms
 */
export const testAssertions = {
  /**
   * Assert that a path exists in mock filesystem, handling platform differences
   */
  expectPathExists: (mockFs: any, path: string) => {
    const normalized = require('./cross-platform-paths.js').normalizeMockPath(path)
    return expect(mockFs.hasPath ? mockFs.hasPath(normalized) : mockFs.mockFiles.has(normalized) || mockFs.mockDirs.has(normalized))
  },
  
  /**
   * Assert that file content matches, handling line ending differences
   */
  expectContentEquals: (actual: string, expected: string) => {
    const normalizeLineEndings = (str: string) => str.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    return expect(normalizeLineEndings(actual)).toBe(normalizeLineEndings(expected))
  },
  
  /**
   * Assert that paths are equivalent across platforms
   */
  expectPathsEqual: (actual: string, expected: string) => {
    const { pathsEqual } = require('./cross-platform-paths.js').pathAssertions
    return expect(pathsEqual(actual, expected)).toBe(true)
  }
}