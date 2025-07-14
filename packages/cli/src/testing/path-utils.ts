/**
 * Cross-Platform Path Utilities for Testing
 *
 * Provides utilities to handle path differences between Windows and Unix systems
 * in tests, ensuring CLIs work correctly on all platforms.
 */

import { join, normalize, sep, posix, win32 } from 'path'

// Platform detection
export const isWindows = process.platform === 'win32'

/**
 * Normalizes paths for cross-platform compatibility
 * Converts all path separators to forward slashes for consistent string comparisons
 */
export function normalizePath(path: string): string {
  return path.split(win32.sep).join(posix.sep)
}

/**
 * Converts paths to POSIX format (forward slashes)
 * Useful for string comparisons in tests
 */
export function toPosixPath(path: string): string {
  return path.split(win32.sep).join(posix.sep)
}

/**
 * Converts paths to Windows format (backslashes)
 * Useful for Windows-specific testing
 */
export function toWindowsPath(path: string): string {
  return path.split(posix.sep).join(win32.sep)
}

/**
 * Creates normalized test paths that work on all platforms
 */
export function createTestPath(...segments: string[]): string {
  return normalize(join(...segments))
}

/**
 * Path assertion helpers for cross-platform testing
 */
export const pathAssertions = {
  /**
   * Checks if a path contains a segment, regardless of separators
   * @example
   * pathAssertions.contains('/user/docs/file.txt', 'docs') // true
   * pathAssertions.contains('C:\\user\\docs\\file.txt', 'docs') // true
   */
  contains(actualPath: string, expectedSegment: string): boolean {
    const normalized = normalizePath(actualPath)
    const segment = normalizePath(expectedSegment)
    return normalized.includes(segment)
  },

  /**
   * Checks if two paths are equivalent, handling separator differences
   * @example
   * pathAssertions.equal('/user/file.txt', 'C:\\user\\file.txt') // true on Windows
   */
  equal(path1: string, path2: string): boolean {
    return normalizePath(path1) === normalizePath(path2)
  },

  /**
   * Checks if a path ends with a segment, handling separators
   * @example
   * pathAssertions.endsWith('/user/docs/readme.md', 'docs/readme.md') // true
   */
  endsWith(path: string, suffix: string): boolean {
    const normalizedPath = normalizePath(path)
    const normalizedSuffix = normalizePath(suffix)
    return normalizedPath.endsWith(normalizedSuffix)
  },

  /**
   * Checks if a path uses correct separators for the platform
   * On Windows, both separators are allowed; on Unix, only forward slashes
   */
  hasCorrectSeparators(path: string): boolean {
    if (isWindows) {
      // Windows accepts both separators
      return true
    }
    // Unix systems should only use forward slashes
    return !path.includes('\\')
  },
}

/**
 * Creates cross-platform regex patterns for path matching
 * @example
 * const pattern = createPathRegex('src/components/*.tsx');
 * pattern.test('src/components/button.tsx'); // true
 * pattern.test('src\\components\\button.tsx'); // true on any platform
 */
export function createPathRegex(pathPattern: string): RegExp {
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
 * Common test paths that work across platforms
 */
export const testPaths = {
  // Mock paths that look native on each platform
  mockProject: isWindows ? 'C:\\test\\project' : '/test/project',
  mockHome: isWindows ? 'C:\\Users\\test' : '/home/test',
  mockConfig: isWindows ? 'C:\\test\\project\\.config' : '/test/project/.config',

  // Path separator for the current platform
  separator: sep,

  // Helpers to create platform-specific paths
  project: (...segments: string[]) => join(testPaths.mockProject, ...segments),
  home: (...segments: string[]) => join(testPaths.mockHome, ...segments),
  config: (...segments: string[]) => join(testPaths.mockConfig, ...segments),
}
