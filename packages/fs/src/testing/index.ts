/**
 * @esteban-url/fs/testing
 *
 * Filesystem testing utilities and mocks.
 * Provides in-memory filesystem mocking and path helpers for testing.
 *
 * @example
 * ```typescript
 * import {
 *   // Filesystem mocking
 *   createMockFileSystem, createTestFileSystem, MockFileSystem,
 *   // Path utilities
 *   createPath, createTempPath, normalizePath,
 *   // Test fixtures
 *   basicProject, configFiles, monorepoStructure
 * } from '@esteban-url/fs/testing'
 *
 * // Create mock filesystem
 * const fs = createMockFileSystem({
 *   'package.json': JSON.stringify({ name: 'test' }),
 *   'src/index.ts': 'export const hello = "world"'
 * })
 *
 * // Test filesystem operations
 * const content = await fs.readFile('package.json')
 * const exists = fs.exists('src/index.ts')
 *
 * // Use path helpers
 * const testPath = createTempPath('test-file')
 * const normalized = normalizePath('/path//to\\file')
 *
 * // Use fixtures
 * const projectFs = createMockFileSystem(basicProject)
 * ```
 */

export * from './mock-fs.js'
export * from '../utils/path-utils.js'
export * from './fixtures.js'
