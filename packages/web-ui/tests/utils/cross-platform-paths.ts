/**
 * Cross-Platform Path Testing Utilities
 * 
 * Provides robust, Windows-compatible path handling for tests.
 * These utilities ensure tests work correctly across Unix and Windows environments.
 */

import { join, resolve, sep, normalize, posix, win32, isAbsolute } from 'path'
import { tmpdir } from 'os'

// Platform detection
export const isWindows = process.platform === 'win32'
export const pathSep = sep

/**
 * Creates normalized, cross-platform paths for testing
 * Always returns paths with proper separators for the current platform
 */
export const createTestPath = (...segments: string[]): string => {
  return normalize(join(...segments))
}

/**
 * Creates absolute paths from project root for testing
 * Ensures consistent behavior across platforms
 */
export const createAbsoluteTestPath = (...segments: string[]): string => {
  return resolve(process.cwd(), ...segments)
}

/**
 * Creates temporary directory paths that work on all platforms
 * Uses OS-specific temp directory as base
 */
export const createTempPath = (testName: string, timestamp = Date.now()): string => {
  return normalize(join(tmpdir(), 'trailhead-tests', `${testName}-${timestamp}`))
}

/**
 * Normalizes file paths for cross-platform mock filesystem
 * Converts all paths to forward slashes for consistent mocking
 */
export const normalizeMockPath = (path: string): string => {
  return path.split(win32.sep).join(posix.sep)
}

/**
 * Creates platform-specific regex patterns for path matching
 * Handles both forward and backslash separators
 */
export const createPathRegex = (pathPattern: string): RegExp => {
  // First replace wildcards with placeholders
  let pattern = pathPattern.replace(/\*/g, '__WILDCARD__')
  
  // Escape special regex characters
  pattern = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
  
  // Handle separators - both forward and back slashes
  pattern = pattern.replace(/\//g, '[/\\\\]')
  
  // Replace wildcard placeholders with proper regex
  pattern = pattern.replace(/__WILDCARD__/g, '[^/\\\\]*')
  
  return new RegExp(`^${pattern}$`)
}

/**
 * Converts Windows paths to POSIX for consistent string comparisons
 * Useful for test assertions that compare path strings
 */
export const toPosixPath = (path: string): string => {
  return path.split(win32.sep).join(posix.sep)
}

/**
 * Converts POSIX paths to Windows format for Windows-specific testing
 */
export const toWindowsPath = (path: string): string => {
  return path.split(posix.sep).join(win32.sep)
}

/**
 * Safe path joining that handles mixed separator inputs
 * Normalizes all inputs before joining
 */
export const safeJoin = (...segments: string[]): string => {
  const normalized = segments.map(segment => 
    segment.split(/[/\\]/).join(sep)
  )
  return normalize(join(...normalized))
}

/**
 * Creates relative paths that work on all platforms
 * Handles edge cases where relative path calculation fails
 */
export const safeRelative = (from: string, to: string): string => {
  try {
    const { relative } = require('path')
    const normalized = relative(normalize(from), normalize(to))
    return normalized || '.'
  } catch {
    // Return relative path calculation or fallback to original 'to' path
    return to
  }
}

/**
 * Mock filesystem path utilities for cross-platform testing
 */
export class MockFileSystemPaths {
  private paths = new Map<string, string>()
  
  /**
   * Adds a path to the mock filesystem with cross-platform normalization
   */
  addPath(path: string, content?: string): string {
    const normalized = this.normalizePath(path)
    this.paths.set(normalized, content || '')
    return normalized
  }
  
  /**
   * Checks if a path exists in the mock filesystem
   */
  hasPath(path: string): boolean {
    const normalized = this.normalizePath(path)
    
    // Check if the exact path exists
    if (this.paths.has(normalized)) {
      return true
    }
    
    // Check if it's a parent directory that should exist due to child files
    return this.isImplicitParentDirectory(normalized)
  }
  
  /**
   * Gets content for a path from mock filesystem
   */
  getContent(path: string): string | undefined {
    const normalized = this.normalizePath(path)
    return this.paths.get(normalized)
  }
  
  /**
   * Normalizes paths for internal storage (always use forward slashes)
   */
  private normalizePath(path: string): string {
    return normalize(path).split(sep).join('/')
  }
  
  /**
   * Checks if a path should be considered an implicit parent directory
   */
  private isImplicitParentDirectory(normalizedPath: string): boolean {
    const prefix = normalizedPath.endsWith('/') ? normalizedPath : normalizedPath + '/'
    
    // Check if any files exist under this path (making it an implicit directory)
    for (const path of this.paths.keys()) {
      if (path.startsWith(prefix)) {
        return true
      }
    }
    
    return false
  }
  
  /**
   * Lists all paths matching a parent directory
   */
  listDirectory(dirPath: string): string[] {
    const normalizedDir = this.normalizePath(dirPath)
    const prefix = normalizedDir.endsWith('/') ? normalizedDir : normalizedDir + '/'
    
    const directChildren = new Set<string>()
    
    // Find direct children (files and subdirectories)
    for (const path of this.paths.keys()) {
      if (path.startsWith(prefix)) {
        const relativePath = path.substring(prefix.length)
        const firstSegment = relativePath.split('/')[0]
        if (firstSegment) {
          directChildren.add(firstSegment)
        }
      }
    }
    
    return Array.from(directChildren)
  }
  
  /**
   * Clears all paths from mock filesystem
   */
  clear(): void {
    this.paths.clear()
  }
  
  /**
   * Gets all stored paths (for debugging)
   */
  getAllPaths(): string[] {
    return Array.from(this.paths.keys())
  }
}

/**
 * Assertion helpers for cross-platform path testing
 */
export const pathAssertions = {
  /**
   * Asserts that a path contains a specific segment, regardless of separators
   */
  pathContains(actualPath: string, expectedSegment: string): boolean {
    const normalizedActual = toPosixPath(actualPath)
    const normalizedExpected = toPosixPath(expectedSegment)
    return normalizedActual.includes(normalizedExpected)
  },
  
  /**
   * Asserts that two paths are equivalent, regardless of separator differences
   */
  pathsEqual(path1: string, path2: string): boolean {
    // Normalize both paths and compare
    const normalized1 = normalize(path1)
    const normalized2 = normalize(path2)
    
    // Also compare POSIX versions for cross-platform compatibility
    const posix1 = toPosixPath(normalized1)
    const posix2 = toPosixPath(normalized2)
    
    return normalized1 === normalized2 || posix1 === posix2
  },
  
  /**
   * Asserts that a path is absolute on the current platform
   */
  isAbsolutePath(path: string): boolean {
    return isAbsolute(path)
  },
  
  /**
   * Asserts that a path uses the correct separator for the current platform
   */
  hasCorrectSeparators(path: string): boolean {
    if (isWindows) {
      // On Windows, both separators are actually allowed
      return true
    }
    return !path.includes('\\')
  }
}

/**
 * Environment-specific path constants for testing
 */
export const testPaths = {
  // Common test directory names that work on all platforms
  temp: createTempPath('temp'),
  fixtures: createAbsoluteTestPath('tests', 'fixtures'),
  output: createTempPath('test-output'),
  
  // Mock paths for consistent testing
  mockProject: isWindows ? 'C:\\test\\project' : '/test/project',
  mockComponents: isWindows ? 'C:\\test\\project\\components' : '/test/project/components',
  mockNodeModules: isWindows ? 'C:\\test\\project\\node_modules' : '/test/project/node_modules',
  
  // Platform-specific separators for string operations
  separator: sep,
  posixSeparator: '/',
  windowsSeparator: '\\',
}

/**
 * Utility for creating platform-agnostic test configurations
 */
export const createTestConfig = (overrides: Record<string, any> = {}) => {
  const baseConfig = {
    projectRoot: testPaths.mockProject,
    componentsDir: safeJoin(testPaths.mockProject, 'components'),
    tempDir: createTempPath('config-test'),
    outputDir: createTempPath('output-test'),
  }
  
  return {
    ...baseConfig,
    ...overrides,
    // Ensure all paths are normalized
    projectRoot: normalize(overrides.projectRoot || baseConfig.projectRoot),
    componentsDir: normalize(overrides.componentsDir || baseConfig.componentsDir),
    tempDir: normalize(overrides.tempDir || baseConfig.tempDir),
    outputDir: normalize(overrides.outputDir || baseConfig.outputDir),
  }
}

/**
 * Debug helper that shows path information for troubleshooting
 */
export const debugPaths = {
  showPathInfo: (path: string) => ({
    original: path,
    normalized: normalize(path),
    posix: toPosixPath(path),
    windows: toWindowsPath(path),
    isAbsolute: isAbsolute(path),
    platform: process.platform,
    separator: sep,
  }),
  
  showEnvironment: () => ({
    platform: process.platform,
    isWindows,
    separator: sep,
    cwd: process.cwd(),
    tmpdir: tmpdir(),
  }),
}