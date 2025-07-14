/**
 * Path testing utilities
 *
 * Helper functions for working with paths in tests.
 */

import { join, resolve, dirname, basename, extname, relative, sep } from 'path'
import { platform } from 'os'

/**
 * Normalizes path separators for cross-platform testing
 */
export const normalizePath = (path: string): string => {
  return path.replace(/[/\\]/g, sep)
}

/**
 * Creates a platform-agnostic path for testing
 */
export const createPath = (...segments: string[]): string => {
  return join(...segments)
}

/**
 * Creates a temporary directory path for testing
 */
export const createTempPath = (prefix = 'test'): string => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return join(getTempDir(), `${prefix}-${timestamp}-${random}`)
}

/**
 * Gets the system temporary directory
 */
export const getTempDir = (): string => {
  if (platform() === 'win32') {
    return process.env.TEMP || process.env.TMP || 'C:\\Windows\\Temp'
  }
  return process.env.TMPDIR || '/tmp'
}

/**
 * Creates a relative path from one path to another
 */
export const createRelativePath = (from: string, to: string): string => {
  return relative(from, to)
}

/**
 * Joins path segments with proper separators
 */
export const joinPaths = (...paths: string[]): string => {
  return join(...paths)
}

/**
 * Resolves a path to an absolute path
 */
export const resolvePath = (path: string, base?: string): string => {
  return base ? resolve(base, path) : resolve(path)
}

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
export const isAbsolute = (path: string): boolean => {
  return resolve(path) === path
}

/**
 * Checks if a path is relative
 */
export const isRelative = (path: string): boolean => {
  return !isAbsolute(path)
}

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

/**
 * Path matchers for testing
 */
export const pathMatchers = {
  /**
   * Matches any path ending with the given suffix
   */
  endsWith:
    (suffix: string) =>
    (path: string): boolean => {
      return path.endsWith(suffix)
    },

  /**
   * Matches any path starting with the given prefix
   */
  startsWith:
    (prefix: string) =>
    (path: string): boolean => {
      return path.startsWith(prefix)
    },

  /**
   * Matches any path containing the given substring
   */
  contains:
    (substring: string) =>
    (path: string): boolean => {
      return path.includes(substring)
    },

  /**
   * Matches any path with the given extension
   */
  hasExtension:
    (extension: string) =>
    (path: string): boolean => {
      return getExtension(path) === extension
    },

  /**
   * Matches any path in the given directory
   */
  inDirectory:
    (directory: string) =>
    (path: string): boolean => {
      return getDirectoryName(path) === directory
    },

  /**
   * Matches any path that is a child of the given directory
   */
  isChildOf:
    (directory: string) =>
    (path: string): boolean => {
      const rel = relative(directory, path)
      return !rel.startsWith('..') && resolve(rel) !== rel
    },
}

/**
 * File system test utilities
 */
export const fsTestUtils = {
  /**
   * Creates a nested directory structure representation
   */
  createNestedStructure: (depth: number, prefix = 'level') => {
    const structure: Record<string, string> = {}

    const createLevel = (currentDepth: number, parentPath: string) => {
      if (currentDepth === 0) return

      const levelPath = joinPaths(parentPath, `${prefix}${currentDepth}`)
      structure[joinPaths(levelPath, 'file.txt')] = `Content at depth ${currentDepth}`

      createLevel(currentDepth - 1, levelPath)
    }

    createLevel(depth, '')
    return structure
  },

  /**
   * Creates a large file structure for performance testing
   */
  createLargeStructure: (fileCount: number, prefix = 'file') => {
    const structure: Record<string, string> = {}

    for (let i = 0; i < fileCount; i++) {
      const dirIndex = Math.floor(i / 10)
      const fileName = `${prefix}${i}.txt`
      const filePath = joinPaths(`dir${dirIndex}`, fileName)
      structure[filePath] = `Content of file ${i}`
    }

    return structure
  },

  /**
   * Creates a structure with various file types
   */
  createMixedStructure: () => ({
    'package.json': JSON.stringify({ name: 'test', version: '1.0.0' }),
    'README.md': '# Test Project',
    'src/index.ts': 'export const hello = "world"',
    'src/utils.js': 'module.exports = { add: (a, b) => a + b }',
    'tests/index.test.ts': 'test("hello", () => {})',
    'docs/api.md': '# API Documentation',
    'config/eslint.json': JSON.stringify({ extends: ['eslint:recommended'] }),
    'assets/logo.png': 'fake-image-content',
    'styles/main.css': 'body { margin: 0; }',
    'scripts/build.sh': '#!/bin/bash\nnpm run build',
  }),
}

/**
 * Path validation utilities
 */
export const pathValidators = {
  /**
   * Validates that a path is safe (no directory traversal)
   */
  isSafe: (path: string, baseDir: string): boolean => {
    const resolved = resolve(baseDir, path)
    return resolved.startsWith(resolve(baseDir))
  },

  /**
   * Validates that a path exists in a given structure
   */
  existsInStructure: (path: string, structure: Record<string, string>): boolean => {
    return path in structure
  },

  /**
   * Validates that a path follows naming conventions
   */
  isValidName: (path: string): boolean => {
    const name = getBaseName(path)
    return /^[a-zA-Z0-9._-]+$/.test(name)
  },

  /**
   * Validates that a path is within allowed directories
   */
  isAllowed: (path: string, allowedDirs: string[]): boolean => {
    return allowedDirs.some((dir) => path.startsWith(dir))
  },
}
