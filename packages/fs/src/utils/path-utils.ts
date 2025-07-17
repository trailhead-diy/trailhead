/**
 * Consolidated path utilities for cross-platform compatibility
 *
 * This module provides consistent path handling across the entire monorepo.
 * All packages should use these utilities instead of duplicating path logic.
 */

import {
  join,
  resolve,
  dirname,
  basename,
  extname,
  relative,
  sep,
  normalize,
  posix,
  win32,
  isAbsolute,
} from 'path'
import { platform, tmpdir } from 'os'

// Platform detection
export const isWindows = platform() === 'win32'
export const pathSep = sep

// ========================================
// Basic Path Operations
// ========================================

/**
 * Normalizes path separators for cross-platform compatibility
 */
export const normalizePath = (path: string): string => {
  return normalize(path.replace(/[/\\]/g, sep))
}

/**
 * Creates a platform-agnostic path for consistent usage
 */
export const createPath = (...segments: string[]): string => {
  return join(...segments)
}

/**
 * Creates normalized, cross-platform paths for testing
 */
export const createTestPath = (...segments: string[]): string => {
  return normalize(join(...segments))
}

/**
 * Creates absolute paths from current working directory
 */
export const createAbsolutePath = (...segments: string[]): string => {
  return resolve(process.cwd(), ...segments)
}

/**
 * Joins path segments with proper separators
 */
export const joinPaths = (...paths: string[]): string => {
  return join(...paths)
}

/**
 * Safe path joining that handles mixed separator inputs
 */
export const safeJoin = (...segments: string[]): string => {
  const normalized = segments.map((segment) => segment.split(/[/\\]/).join(sep))
  return normalize(join(...normalized))
}

/**
 * Resolves a path to an absolute path
 */
export const resolvePath = (path: string, base?: string): string => {
  return base ? resolve(base, path) : resolve(path)
}

/**
 * Creates relative paths that work on all platforms
 */
export const createRelativePath = (from: string, to: string): string => {
  try {
    const normalized = relative(normalize(from), normalize(to))
    return normalized || '.'
  } catch {
    return to
  }
}

/**
 * Safe relative path calculation with fallback
 */
export const safeRelative = (from: string, to: string): string => {
  return createRelativePath(from, to)
}

// ========================================
// Path Information
// ========================================

/**
 * Gets the directory name of a path
 */
export const getDirectoryName = (path: string): string => {
  return dirname(path)
}

/**
 * Gets the base name of a path
 */
export const getBaseName = (path: string, ext?: string): string => {
  return basename(path, ext)
}

/**
 * Gets the extension of a path
 */
export const getExtension = (path: string): string => {
  return extname(path)
}

/**
 * Checks if a path is absolute
 */
export const isAbsolutePath = (path: string): boolean => {
  return isAbsolute(path)
}

/**
 * Checks if a path is relative
 */
export const isRelativePath = (path: string): boolean => {
  return !isAbsolute(path)
}

// ========================================
// Path Conversion
// ========================================

/**
 * Converts a path to use forward slashes (for consistent testing)
 */
export const toForwardSlashes = (path: string): string => {
  return path.replace(/\\/g, '/')
}

/**
 * Converts a path to use backslashes (for Windows testing)
 */
export const toBackslashes = (path: string): string => {
  return path.replace(/\//g, '\\')
}

/**
 * Converts Windows paths to POSIX for consistent string comparisons
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
 * Normalizes file paths for cross-platform mock filesystem
 */
export const normalizeMockPath = (path: string): string => {
  return path.split(win32.sep).join(posix.sep)
}

// ========================================
// Temporary Paths
// ========================================

/**
 * Gets the system temporary directory
 */
export const getTempDir = (): string => {
  return tmpdir()
}

/**
 * Creates a temporary directory path for testing
 */
export const createTempPath = (prefix = 'test', timestamp = Date.now()): string => {
  const random = Math.random().toString(36).substring(2, 8)
  return normalize(join(getTempDir(), 'trailhead-tests', `${prefix}-${timestamp}-${random}`))
}

// ========================================
// Path Validation
// ========================================

/**
 * Validates that a path is safe (no directory traversal)
 */
export const isSafePath = (path: string, baseDir: string): boolean => {
  const resolved = resolve(baseDir, path)
  return resolved.startsWith(resolve(baseDir))
}

/**
 * Validates that a path follows naming conventions
 */
export const isValidName = (path: string): boolean => {
  const name = getBaseName(path)
  return /^[a-zA-Z0-9._-]+$/.test(name)
}

/**
 * Validates that a path is within allowed directories
 */
export const isAllowedPath = (path: string, allowedDirs: string[]): boolean => {
  return allowedDirs.some((dir) => path.startsWith(dir))
}

// ========================================
// Path Matching
// ========================================

/**
 * Creates platform-specific regex patterns for path matching
 */
export const createPathRegex = (pathPattern: string): RegExp => {
  let pattern = pathPattern.replace(/\*/g, '__WILDCARD__')
  pattern = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
  pattern = pattern.replace(/\//g, '[/\\\\]')
  pattern = pattern.replace(/__WILDCARD__/g, '[^/\\\\]*')
  return new RegExp(`^${pattern}$`)
}

/**
 * Path matchers for testing and filtering
 */
export const pathMatchers = {
  endsWith:
    (suffix: string) =>
    (path: string): boolean =>
      path.endsWith(suffix),
  startsWith:
    (prefix: string) =>
    (path: string): boolean =>
      path.startsWith(prefix),
  contains:
    (substring: string) =>
    (path: string): boolean =>
      path.includes(substring),
  hasExtension:
    (extension: string) =>
    (path: string): boolean =>
      getExtension(path) === extension,
  inDirectory:
    (directory: string) =>
    (path: string): boolean =>
      getDirectoryName(path) === directory,
  isChildOf:
    (directory: string) =>
    (path: string): boolean => {
      const rel = relative(directory, path)
      return !rel.startsWith('..') && resolve(rel) !== rel
    },
}

// ========================================
// Path Assertions
// ========================================

/**
 * Assertion helpers for cross-platform path testing
 */
export const pathAssertions = {
  /**
   * Asserts that a path contains a specific segment
   */
  pathContains(actualPath: string, expectedSegment: string): boolean {
    const normalizedActual = toPosixPath(actualPath)
    const normalizedExpected = toPosixPath(expectedSegment)
    return normalizedActual.includes(normalizedExpected)
  },

  /**
   * Asserts that two paths are equivalent
   */
  pathsEqual(path1: string, path2: string): boolean {
    const normalized1 = normalize(path1)
    const normalized2 = normalize(path2)
    const posix1 = toPosixPath(normalized1)
    const posix2 = toPosixPath(normalized2)
    return normalized1 === normalized2 || posix1 === posix2
  },

  /**
   * Asserts that a path uses correct separators
   */
  hasCorrectSeparators(path: string): boolean {
    return isWindows || !path.includes('\\')
  },
}

// ========================================
// Project Structure Utilities
// ========================================

/**
 * Creates a mock project structure for testing
 */
export const createProjectStructure = (projectName: string) => {
  const base = createPath(projectName)
  return {
    root: base,
    src: joinPaths(base, 'src'),
    tests: joinPaths(base, 'tests'),
    dist: joinPaths(base, 'dist'),
    nodeModules: joinPaths(base, 'node_modules'),
    packageJson: joinPaths(base, 'package.json'),
    tsconfig: joinPaths(base, 'tsconfig.json'),
    readme: joinPaths(base, 'README.md'),
    gitignore: joinPaths(base, '.gitignore'),
    indexTs: joinPaths(base, 'src', 'index.ts'),
    indexTest: joinPaths(base, 'tests', 'index.test.ts'),
  }
}

// ========================================
// Test Path Constants
// ========================================

/**
 * Environment-specific path constants for testing
 */
export const testPaths = {
  temp: createTempPath('temp'),
  fixtures: createAbsolutePath('tests', 'fixtures'),
  output: createTempPath('test-output'),
  mockProject: isWindows ? 'C:\\test\\project' : '/test/project',
  mockComponents: isWindows ? 'C:\\test\\project\\components' : '/test/project/components',
  mockNodeModules: isWindows ? 'C:\\test\\project\\node_modules' : '/test/project/node_modules',
  separator: sep,
  posixSeparator: '/',
  windowsSeparator: '\\',
}

// ========================================
// Configuration Helper
// ========================================

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
    projectRoot: normalize(overrides.projectRoot || baseConfig.projectRoot),
    componentsDir: normalize(overrides.componentsDir || baseConfig.componentsDir),
    tempDir: normalize(overrides.tempDir || baseConfig.tempDir),
    outputDir: normalize(overrides.outputDir || baseConfig.outputDir),
  }
}

// ========================================
// Backwards Compatibility Exports
// ========================================

// All exports are already available above, no need to re-export them
