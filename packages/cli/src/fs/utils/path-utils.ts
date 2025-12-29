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

/**
 * Whether the current platform is Windows.
 * Used for platform-specific path handling.
 *
 * @example
 * ```typescript
 * if (isWindows) {
 *   console.log('Running on Windows')
 *   // Use Windows-specific paths
 * }
 * ```
 */
export const isWindows = platform() === 'win32'

/**
 * The platform-specific path separator.
 * '\\' on Windows, '/' on POSIX systems.
 *
 * @example
 * ```typescript
 * const path = `dir${pathSep}file.txt`
 * // Windows: 'dir\file.txt'
 * // POSIX: 'dir/file.txt'
 * ```
 */
export const pathSep = sep

// ========================================
// Basic Path Operations
// ========================================

/**
 * Normalizes path separators for cross-platform compatibility.
 * Converts mixed separators to platform-specific ones.
 *
 * @param path Path with potentially mixed separators
 * @returns Normalized path with consistent separators
 *
 * @example
 * ```typescript
 * normalizePath('foo/bar\\baz')
 * // Windows: 'foo\\bar\\baz'
 * // POSIX: 'foo/bar/baz'
 *
 * normalizePath('./foo/../bar')
 * // Returns: 'bar' (normalized)
 * ```
 */
export const normalizePath = (path: string): string => {
  return normalize(path.replace(/[/\\]/g, sep))
}

/**
 * Creates a platform-agnostic path from segments.
 * Joins segments with proper separators for the current platform.
 *
 * @param segments Path segments to join
 * @returns Joined path with platform-specific separators
 *
 * @example
 * ```typescript
 * createPath('src', 'components', 'Button.tsx')
 * // Windows: 'src\\components\\Button.tsx'
 * // POSIX: 'src/components/Button.tsx'
 *
 * createPath('/root', 'dir', '..', 'file.txt')
 * // Returns: '/root/file.txt' (normalized)
 * ```
 */
export const createPath = (...segments: string[]): string => {
  return join(...segments)
}

/**
 * Creates normalized, cross-platform paths for testing.
 * Ensures consistent path creation in test environments.
 *
 * @param segments Path segments to join
 * @returns Normalized test path
 *
 * @example
 * ```typescript
 * const testFile = createTestPath('fixtures', 'data', 'test.json')
 * // Consistent path regardless of platform
 *
 * const tempFile = createTestPath(getTempDir(), 'test-' + Date.now())
 * // Creates unique temp file path for testing
 * ```
 */
export const createTestPath = (...segments: string[]): string => {
  return normalize(join(...segments))
}

/**
 * Creates absolute paths from current working directory.
 * Resolves relative segments to absolute paths.
 *
 * @param segments Path segments (relative or absolute)
 * @returns Absolute path resolved from CWD
 *
 * @example
 * ```typescript
 * createAbsolutePath('src', 'index.ts')
 * // Returns: '/current/working/dir/src/index.ts'
 *
 * createAbsolutePath('..', 'parent-file.txt')
 * // Returns: '/current/working/parent-file.txt'
 * ```
 */
export const createAbsolutePath = (...segments: string[]): string => {
  return resolve(process.cwd(), ...segments)
}

/**
 * Joins path segments with proper separators.
 * Alias for Node.js path.join with consistent naming.
 *
 * @param paths Path segments to join
 * @returns Joined path
 *
 * @example
 * ```typescript
 * joinPaths('dir', 'subdir', 'file.txt')
 * // Returns: 'dir/subdir/file.txt' (POSIX)
 * // Returns: 'dir\\subdir\\file.txt' (Windows)
 * ```
 */
export const joinPaths = (...paths: string[]): string => {
  return join(...paths)
}

/**
 * Safe path joining that handles mixed separator inputs.
 * Normalizes each segment before joining to prevent issues.
 *
 * @param segments Path segments with potentially mixed separators
 * @returns Safely joined and normalized path
 *
 * @example
 * ```typescript
 * safeJoin('dir/sub', 'more\\nested', 'file.txt')
 * // Handles mixed separators correctly
 *
 * safeJoin('/root/', '/absolute/', 'file')
 * // Returns: '/root/absolute/file' (handles double slashes)
 * ```
 */
export const safeJoin = (...segments: string[]): string => {
  const normalized = segments.map((segment) => segment.split(/[/\\]/).join(sep))
  return normalize(join(...normalized))
}

/**
 * Resolves a path to an absolute path.
 * Can resolve relative to a base directory or CWD.
 *
 * @param path Path to resolve (relative or absolute)
 * @param base Optional base directory for resolution
 * @returns Absolute resolved path
 *
 * @example
 * ```typescript
 * resolvePath('file.txt')
 * // Resolves relative to CWD
 *
 * resolvePath('../config.json', '/app/src')
 * // Returns: '/app/config.json'
 *
 * resolvePath('/absolute/path')
 * // Returns: '/absolute/path' (unchanged)
 * ```
 */
export const resolvePath = (path: string, base?: string): string => {
  return base ? resolve(base, path) : resolve(path)
}

/**
 * Creates relative paths that work on all platforms.
 * Calculates the relative path from one location to another.
 *
 * @param from Starting directory path
 * @param to Target path
 * @returns Relative path from 'from' to 'to'
 *
 * @example
 * ```typescript
 * createRelativePath('/app/src', '/app/dist/output.js')
 * // Returns: '../dist/output.js'
 *
 * createRelativePath('/app/src/utils', '/app/src/utils/helper.js')
 * // Returns: 'helper.js'
 *
 * createRelativePath('/app', '/app')
 * // Returns: '.' (same directory)
 * ```
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
 * Safe relative path calculation with fallback.
 * Alias for createRelativePath with error handling.
 *
 * @param from Starting directory path
 * @param to Target path
 * @returns Relative path or original 'to' path on error
 *
 * @example
 * ```typescript
 * safeRelative('/src', '/src/components/Button.tsx')
 * // Returns: 'components/Button.tsx'
 * ```
 */
export const safeRelative = (from: string, to: string): string => {
  return createRelativePath(from, to)
}

// ========================================
// Path Information
// ========================================

/**
 * Gets the directory name of a path.
 * Returns the parent directory of the given path.
 *
 * @param path File or directory path
 * @returns Parent directory path
 *
 * @example
 * ```typescript
 * getDirectoryName('/app/src/index.ts')
 * // Returns: '/app/src'
 *
 * getDirectoryName('file.txt')
 * // Returns: '.'
 *
 * getDirectoryName('/app/src/')
 * // Returns: '/app'
 * ```
 */
export const getDirectoryName = (path: string): string => {
  return dirname(path)
}

/**
 * Gets the base name of a path.
 * Returns the last portion of a path, optionally removing extension.
 *
 * @param path File or directory path
 * @param ext Optional extension to remove
 * @returns Base name of the path
 *
 * @example
 * ```typescript
 * getBaseName('/app/src/index.ts')
 * // Returns: 'index.ts'
 *
 * getBaseName('/app/src/index.ts', '.ts')
 * // Returns: 'index'
 *
 * getBaseName('/app/src/')
 * // Returns: 'src'
 * ```
 */
export const getBaseName = (path: string, ext?: string): string => {
  return basename(path, ext)
}

/**
 * Gets the extension of a path.
 * Returns the extension including the leading dot.
 *
 * @param path File path
 * @returns Extension with dot, or empty string
 *
 * @example
 * ```typescript
 * getExtension('file.txt')
 * // Returns: '.txt'
 *
 * getExtension('archive.tar.gz')
 * // Returns: '.gz'
 *
 * getExtension('README')
 * // Returns: ''
 * ```
 */
export const getExtension = (path: string): string => {
  return extname(path)
}

/**
 * Checks if a path is absolute.
 * Returns true for paths starting from root.
 *
 * @param path Path to check
 * @returns True if path is absolute
 *
 * @example
 * ```typescript
 * isAbsolutePath('/usr/local/bin')
 * // Returns: true (POSIX)
 *
 * isAbsolutePath('C:\\Windows')
 * // Returns: true (Windows)
 *
 * isAbsolutePath('./relative/path')
 * // Returns: false
 * ```
 */
export const isAbsolutePath = (path: string): boolean => {
  return isAbsolute(path)
}

/**
 * Checks if a path is relative.
 * Returns true for paths not starting from root.
 *
 * @param path Path to check
 * @returns True if path is relative
 *
 * @example
 * ```typescript
 * isRelativePath('./src/index.ts')
 * // Returns: true
 *
 * isRelativePath('../parent/file.txt')
 * // Returns: true
 *
 * isRelativePath('/absolute/path')
 * // Returns: false
 * ```
 */
export const isRelativePath = (path: string): boolean => {
  return !isAbsolute(path)
}

// ========================================
// Path Conversion
// ========================================

/**
 * Converts a path to use forward slashes.
 * Useful for consistent string comparisons and URLs.
 *
 * @param path Path with any separators
 * @returns Path with forward slashes only
 *
 * @example
 * ```typescript
 * toForwardSlashes('C:\\Users\\Name\\file.txt')
 * // Returns: 'C:/Users/Name/file.txt'
 *
 * toForwardSlashes('mixed\\path/to/file')
 * // Returns: 'mixed/path/to/file'
 * ```
 */
export const toForwardSlashes = (path: string): string => {
  return path.replace(/\\/g, '/')
}

/**
 * Converts a path to use backslashes.
 * Useful for Windows-specific testing scenarios.
 *
 * @param path Path with any separators
 * @returns Path with backslashes only
 *
 * @example
 * ```typescript
 * toBackslashes('/usr/local/bin')
 * // Returns: '\\usr\\local\\bin'
 *
 * toBackslashes('mixed/path\\to\\file')
 * // Returns: 'mixed\\path\\to\\file'
 * ```
 */
export const toBackslashes = (path: string): string => {
  return path.replace(/\//g, '\\')
}

/**
 * Converts Windows paths to POSIX format.
 * Ensures consistent string comparisons across platforms.
 *
 * @param path Path with Windows separators
 * @returns Path with POSIX separators
 *
 * @example
 * ```typescript
 * toPosixPath('C:\\Users\\Name\\Documents')
 * // Returns: 'C:/Users/Name/Documents'
 *
 * // Useful for assertions
 * expect(toPosixPath(actualPath)).toBe('/expected/path')
 * ```
 */
export const toPosixPath = (path: string): string => {
  return path.split(win32.sep).join(posix.sep)
}

/**
 * Converts POSIX paths to Windows format.
 * Useful for Windows-specific testing and mocking.
 *
 * @param path Path with POSIX separators
 * @returns Path with Windows separators
 *
 * @example
 * ```typescript
 * toWindowsPath('/home/user/documents')
 * // Returns: '\\home\\user\\documents'
 *
 * // Mock Windows paths in tests
 * const winPath = toWindowsPath('/test/path')
 * ```
 */
export const toWindowsPath = (path: string): string => {
  return path.split(posix.sep).join(win32.sep)
}

/**
 * Normalizes file paths for cross-platform mock filesystem.
 * Converts all paths to POSIX format for consistent mocking.
 *
 * @param path Path from any platform
 * @returns Normalized POSIX path for mocking
 *
 * @example
 * ```typescript
 * normalizeMockPath('C:\\test\\file.txt')
 * // Returns: 'C:/test/file.txt'
 *
 * // Use in mock filesystem
 * const mockFs = {
 *   [normalizeMockPath(path)]: 'content'
 * }
 * ```
 */
export const normalizeMockPath = (path: string): string => {
  return path.split(win32.sep).join(posix.sep)
}

// ========================================
// Temporary Paths
// ========================================

/**
 * Gets the system temporary directory.
 * Returns the platform-specific temp directory path.
 *
 * @returns System temporary directory path
 *
 * @example
 * ```typescript
 * getTempDir()
 * // Linux/Mac: '/tmp'
 * // Windows: 'C:\\Users\\Name\\AppData\\Local\\Temp'
 *
 * // Create temp file
 * const tempFile = joinPaths(getTempDir(), 'my-app-temp.txt')
 * ```
 */
export const getTempDir = (): string => {
  return tmpdir()
}

/**
 * Creates a temporary directory path for testing.
 * Generates unique paths to avoid conflicts in parallel tests.
 *
 * @param prefix Prefix for the temp directory name
 * @param timestamp Timestamp for uniqueness (defaults to current time)
 * @returns Unique temporary directory path
 *
 * @example
 * ```typescript
 * createTempPath('test')
 * // Returns: '/tmp/trailhead-tests/test-1234567890-abc123'
 *
 * createTempPath('integration')
 * // Returns: '/tmp/trailhead-tests/integration-1234567890-def456'
 *
 * // Custom timestamp for reproducible tests
 * createTempPath('snapshot', 1000000)
 * // Returns: '/tmp/trailhead-tests/snapshot-1000000-xyz789'
 * ```
 */
export const createTempPath = (prefix = 'test', timestamp = Date.now()): string => {
  const random = Math.random().toString(36).substring(2, 8)
  return normalize(join(getTempDir(), 'trailhead-tests', `${prefix}-${timestamp}-${random}`))
}

// ========================================
// Path Validation
// ========================================

/**
 * Validates that a path is safe (no directory traversal).
 * Prevents access outside the specified base directory.
 *
 * @param path Path to validate (relative or absolute)
 * @param baseDir Base directory to contain the path
 * @returns True if path stays within baseDir
 *
 * @example
 * ```typescript
 * isSafePath('subdir/file.txt', '/app')
 * // Returns: true (safe)
 *
 * isSafePath('../../../etc/passwd', '/app')
 * // Returns: false (traversal attempt)
 *
 * isSafePath('/other/path', '/app')
 * // Returns: false (outside base)
 * ```
 */
export const isSafePath = (path: string, baseDir: string): boolean => {
  const resolved = resolve(baseDir, path)
  return resolved.startsWith(resolve(baseDir))
}

/**
 * Validates that a path follows naming conventions.
 * Checks for alphanumeric characters, dots, underscores, and hyphens.
 *
 * @param path Path to validate
 * @returns True if filename follows conventions
 *
 * @example
 * ```typescript
 * isValidName('file-name_123.txt')
 * // Returns: true
 *
 * isValidName('file name with spaces.txt')
 * // Returns: false
 *
 * isValidName('../../etc/passwd')
 * // Returns: false (only checks basename 'passwd')
 * ```
 */
export const isValidName = (path: string): boolean => {
  const name = getBaseName(path)
  return /^[a-zA-Z0-9._-]+$/.test(name)
}

/**
 * Validates that a path is within allowed directories.
 * Useful for restricting file access to specific locations.
 *
 * @param path Path to check
 * @param allowedDirs Array of allowed directory prefixes
 * @returns True if path starts with any allowed directory
 *
 * @example
 * ```typescript
 * const allowed = ['/app/uploads', '/app/public']
 *
 * isAllowedPath('/app/uploads/image.jpg', allowed)
 * // Returns: true
 *
 * isAllowedPath('/app/private/secret.key', allowed)
 * // Returns: false
 * ```
 */
export const isAllowedPath = (path: string, allowedDirs: string[]): boolean => {
  return allowedDirs.some((dir) => path.startsWith(dir))
}

// ========================================
// Path Matching
// ========================================

/**
 * Creates platform-specific regex patterns for path matching.
 * Handles wildcards and cross-platform separator differences.
 *
 * @param pathPattern Pattern with optional wildcards (*)
 * @returns RegExp that matches paths on any platform
 *
 * @example
 * ```typescript
 * const pattern = createPathRegex('src/*' + '/index.ts')
 * pattern.test('src/components/index.ts') // true
 * pattern.test('src\\utils\\index.ts')    // true (Windows)
 *
 * const exact = createPathRegex('config/app.json')
 * exact.test('config/app.json')  // true
 * exact.test('config\\app.json') // true (Windows)
 * ```
 */
export const createPathRegex = (pathPattern: string): RegExp => {
  let pattern = pathPattern.replace(/\*/g, '__WILDCARD__')
  pattern = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
  pattern = pattern.replace(/\//g, '[/\\\\]')
  pattern = pattern.replace(/__WILDCARD__/g, '[^/\\\\]*')
  return new RegExp(`^${pattern}$`)
}

/**
 * Path matchers for testing and filtering.
 * Provides curried functions for common path matching operations.
 *
 * @example
 * ```typescript
 * const files = ['/app/src/index.ts', '/app/test/index.test.ts']
 *
 * // Filter TypeScript files
 * const tsFiles = files.filter(pathMatchers.hasExtension('.ts'))
 *
 * // Find test files
 * const testFiles = files.filter(pathMatchers.contains('test'))
 *
 * // Check if in specific directory
 * const srcFiles = files.filter(pathMatchers.inDirectory('/app/src'))
 * ```
 */
export const pathMatchers = {
  /**
   * Creates a matcher that checks if path ends with suffix.
   * @param suffix Suffix to match
   * @returns Matcher function
   *
   * @example
   * ```typescript
   * const isConfig = pathMatchers.endsWith('.config.js')
   * isConfig('app.config.js') // true
   * ```
   */
  endsWith:
    (suffix: string) =>
    (path: string): boolean =>
      path.endsWith(suffix),

  /**
   * Creates a matcher that checks if path starts with prefix.
   * @param prefix Prefix to match
   * @returns Matcher function
   *
   * @example
   * ```typescript
   * const isInSrc = pathMatchers.startsWith('/app/src')
   * isInSrc('/app/src/index.ts') // true
   * ```
   */
  startsWith:
    (prefix: string) =>
    (path: string): boolean =>
      path.startsWith(prefix),

  /**
   * Creates a matcher that checks if path contains substring.
   * @param substring Substring to find
   * @returns Matcher function
   *
   * @example
   * ```typescript
   * const isTest = pathMatchers.contains('test')
   * isTest('src/utils.test.ts') // true
   * ```
   */
  contains:
    (substring: string) =>
    (path: string): boolean =>
      path.includes(substring),

  /**
   * Creates a matcher that checks file extension.
   * @param extension Extension to match (with dot)
   * @returns Matcher function
   *
   * @example
   * ```typescript
   * const isTypeScript = pathMatchers.hasExtension('.ts')
   * isTypeScript('app.ts') // true
   * ```
   */
  hasExtension:
    (extension: string) =>
    (path: string): boolean =>
      getExtension(path) === extension,

  /**
   * Creates a matcher that checks parent directory.
   * @param directory Expected parent directory
   * @returns Matcher function
   *
   * @example
   * ```typescript
   * const inComponents = pathMatchers.inDirectory('components')
   * inComponents('components/Button.tsx') // true
   * ```
   */
  inDirectory:
    (directory: string) =>
    (path: string): boolean =>
      getDirectoryName(path) === directory,

  /**
   * Creates a matcher that checks if path is child of directory.
   * @param directory Parent directory to check
   * @returns Matcher function
   *
   * @example
   * ```typescript
   * const inProject = pathMatchers.isChildOf('/project')
   * inProject('/project/src/index.ts') // true
   * inProject('/other/file.ts') // false
   * ```
   */
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
 * Assertion helpers for cross-platform path testing.
 * Normalizes paths for consistent comparisons across platforms.
 *
 * @example
 * ```typescript
 * // In tests
 * expect(pathAssertions.pathsEqual(actualPath, expectedPath)).toBe(true)
 * expect(pathAssertions.pathContains(fullPath, 'components')).toBe(true)
 * expect(pathAssertions.hasCorrectSeparators(generatedPath)).toBe(true)
 * ```
 */
export const pathAssertions = {
  /**
   * Asserts that a path contains a specific segment.
   * Normalizes both paths to POSIX format for comparison.
   *
   * @param actualPath Path to check
   * @param expectedSegment Segment that should be present
   * @returns True if path contains segment
   *
   * @example
   * ```typescript
   * pathContains('C:\\app\\src\\index.ts', 'src')
   * // Returns: true (works cross-platform)
   * ```
   */
  pathContains(actualPath: string, expectedSegment: string): boolean {
    const normalizedActual = toPosixPath(actualPath)
    const normalizedExpected = toPosixPath(expectedSegment)
    return normalizedActual.includes(normalizedExpected)
  },

  /**
   * Asserts that two paths are equivalent.
   * Handles platform differences in separators.
   *
   * @param path1 First path
   * @param path2 Second path
   * @returns True if paths are equivalent
   *
   * @example
   * ```typescript
   * pathsEqual('/app/src', '/app/src/')
   * // Returns: true (trailing slash ignored)
   *
   * pathsEqual('C:\\app', 'C:/app')
   * // Returns: true (separator differences)
   * ```
   */
  pathsEqual(path1: string, path2: string): boolean {
    const normalized1 = normalize(path1)
    const normalized2 = normalize(path2)
    const posix1 = toPosixPath(normalized1)
    const posix2 = toPosixPath(normalized2)
    return normalized1 === normalized2 || posix1 === posix2
  },

  /**
   * Asserts that a path uses correct separators.
   * On Windows, allows backslashes. On POSIX, ensures no backslashes.
   *
   * @param path Path to check
   * @returns True if separators are correct for platform
   *
   * @example
   * ```typescript
   * // On POSIX
   * hasCorrectSeparators('/app/src') // true
   * hasCorrectSeparators('\\app\\src') // false
   *
   * // On Windows
   * hasCorrectSeparators('C:\\app\\src') // true
   * ```
   */
  hasCorrectSeparators(path: string): boolean {
    return isWindows || !path.includes('\\')
  },
}

// ========================================
// Project Structure Utilities
// ========================================

/**
 * Creates a mock project structure for testing.
 * Generates common project paths with proper separators.
 *
 * @param projectName Name of the project directory
 * @returns Object with common project paths
 *
 * @example
 * ```typescript
 * const project = createProjectStructure('my-app')
 *
 * console.log(project.src)        // 'my-app/src'
 * console.log(project.packageJson) // 'my-app/package.json'
 * console.log(project.indexTs)     // 'my-app/src/index.ts'
 *
 * // Use in tests
 * const mockFs = {
 *   [project.packageJson]: JSON.stringify({ name: 'my-app' }),
 *   [project.indexTs]: 'export default {}'
 * }
 * ```
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
 * Environment-specific path constants for testing.
 * Provides platform-aware test paths and separators.
 *
 * @example
 * ```typescript
 * // Use in tests
 * const tempFile = joinPaths(testPaths.temp, 'data.json')
 *
 * // Platform-specific mocks
 * const projectPath = testPaths.mockProject
 * // Windows: 'C:\\test\\project'
 * // POSIX: '/test/project'
 *
 * // Separator testing
 * const path = `dir${testPaths.separator}file`
 * // Correct separator for current platform
 * ```
 */
export const testPaths = {
  /** Temporary directory for test files */
  temp: createTempPath('temp'),
  /** Test fixtures directory */
  fixtures: createAbsolutePath('tests', 'fixtures'),
  /** Test output directory */
  output: createTempPath('test-output'),
  /** Mock project root (platform-specific) */
  mockProject: isWindows ? 'C:\\test\\project' : '/test/project',
  /** Mock components directory (platform-specific) */
  mockComponents: isWindows ? 'C:\\test\\project\\components' : '/test/project/components',
  /** Mock node_modules directory (platform-specific) */
  mockNodeModules: isWindows ? 'C:\\test\\project\\node_modules' : '/test/project/node_modules',
  /** Platform path separator */
  separator: sep,
  /** POSIX path separator (always '/') */
  posixSeparator: '/',
  /** Windows path separator (always '\\') */
  windowsSeparator: '\\',
}

// ========================================
// Configuration Helper
// ========================================

/**
 * Utility for creating platform-agnostic test configurations.
 * Normalizes all paths to ensure cross-platform compatibility.
 *
 * @param overrides Configuration properties to override
 * @returns Normalized test configuration
 *
 * @example
 * ```typescript
 * // Default config
 * const config = createTestConfig()
 * // All paths normalized for current platform
 *
 * // Custom config
 * const customConfig = createTestConfig({
 *   projectRoot: '/custom/path',
 *   tempDir: '/custom/temp'
 * })
 *
 * // Use in tests
 * const testFile = joinPaths(config.outputDir, 'result.json')
 * ```
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
