/**
 * In-memory filesystem mock for testing
 *
 * Provides a complete filesystem implementation that operates in-memory
 * for fast, isolated testing without touching the real filesystem.
 *
 * @example
 * ```typescript
 * import { createMockFileSystem, createTestFileSystem } from '@esteban-url/fs/testing'
 *
 * // Create with initial files
 * const fs = createMockFileSystem({
 *   'package.json': JSON.stringify({ name: 'test' }),
 *   'src/index.ts': 'export const hello = "world"'
 * })
 *
 * // Use filesystem operations
 * const result = await fs.readFile('package.json')
 * if (result.isOk()) {
 *   console.log(result.value) // File content
 * }
 *
 * // Create empty filesystem
 * const emptyFs = createTestFileSystem()
 * ```
 */

import { ok, err, type Result } from '@esteban-url/core'
import type { FileStats, FileSystemError, MkdirOptions } from '../types.js'
import { createFileSystemError } from '../errors.js'
import { dirname, resolve } from 'path'

/**
 * In-memory file system node
 */
interface FSNode {
  type: 'file' | 'directory'
  content?: string
  children?: Map<string, FSNode>
  stats: FileStats
}

/**
 * Mock filesystem implementation
 */
export class MockFileSystem {
  private root: FSNode
  private cwd: string

  constructor(initialFiles: Record<string, string> = {}) {
    this.root = this.createDirectory()
    this.cwd = process.cwd()

    // Initialize with provided files
    for (const [path, content] of Object.entries(initialFiles)) {
      this.writeFileSync(path, content)
    }
  }

  /**
   * Creates a directory node
   */
  private createDirectory(): FSNode {
    return {
      type: 'directory',
      children: new Map(),
      stats: {
        isFile: false,
        isDirectory: true,
        isSymbolicLink: false,
        size: 0,
        mtime: new Date(),
      },
    }
  }

  /**
   * Creates a file node
   */
  private createFile(content: string): FSNode {
    return {
      type: 'file',
      content,
      stats: {
        isFile: true,
        isDirectory: false,
        isSymbolicLink: false,
        size: content.length,
        mtime: new Date(),
      },
    }
  }

  /**
   * Normalizes a path to be absolute
   */
  private normalizePath(path: string): string {
    return resolve(this.cwd, path)
  }

  /**
   * Splits a path into segments
   */
  private splitPath(path: string): string[] {
    const normalized = this.normalizePath(path)
    return normalized.split(/[/\\]/).filter(Boolean)
  }

  /**
   * Finds a node at the given path
   */
  private findNode(path: string): FSNode | null {
    const segments = this.splitPath(path)
    let current = this.root

    for (const segment of segments) {
      if (current.type !== 'directory' || !current.children) {
        return null
      }
      const child = current.children.get(segment)
      if (!child) {
        return null
      }
      current = child
    }

    return current
  }

  /**
   * Ensures parent directories exist
   */
  private ensureParentDirs(path: string): Result<void, FileSystemError> {
    const parent = dirname(path)
    if (parent === path) return ok(undefined) // Root directory

    const parentResult = this.mkdirSync(parent, { recursive: true })
    if (parentResult.isErr()) {
      return parentResult
    }

    return ok(undefined)
  }

  /**
   * Synchronous file read
   */
  private readFileSync(path: string): Result<string, FileSystemError> {
    const node = this.findNode(path)

    if (!node) {
      return err(
        createFileSystemError('readFile', `no such file or directory: ${path}`, {
          path,
          code: 'ENOENT',
        })
      )
    }

    if (node.type !== 'file') {
      return err(
        createFileSystemError('readFile', `illegal operation on a directory: ${path}`, {
          path,
          code: 'EISDIR',
        })
      )
    }

    return ok(node.content || '')
  }

  /**
   * Synchronous file write
   */
  private writeFileSync(path: string, content: string): Result<void, FileSystemError> {
    const parentResult = this.ensureParentDirs(path)
    if (parentResult.isErr()) {
      return parentResult
    }

    const segments = this.splitPath(path)
    const filename = segments.pop()

    if (!filename) {
      return err(
        createFileSystemError('writeFile', `invalid filename: ${path}`, { path, code: 'EINVAL' })
      )
    }

    let current = this.root
    for (const segment of segments) {
      if (current.type !== 'directory' || !current.children) {
        return err(
          createFileSystemError('writeFile', `not a directory: ${segment}`, {
            path,
            code: 'ENOTDIR',
          })
        )
      }

      let child = current.children.get(segment)
      if (!child) {
        child = this.createDirectory()
        current.children.set(segment, child)
      }

      if (child.type !== 'directory') {
        return err(
          createFileSystemError('writeFile', `not a directory: ${segment}`, {
            path,
            code: 'ENOTDIR',
          })
        )
      }

      current = child
    }

    if (current.type !== 'directory' || !current.children) {
      return err(
        createFileSystemError('writeFile', `parent is not a directory: ${path}`, {
          path,
          code: 'ENOTDIR',
        })
      )
    }

    current.children.set(filename, this.createFile(content))
    return ok(undefined)
  }

  /**
   * Synchronous directory creation
   */
  private mkdirSync(path: string, _options: MkdirOptions = {}): Result<void, FileSystemError> {
    const segments = this.splitPath(path)
    let current = this.root

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]

      if (current.type !== 'directory' || !current.children) {
        return err(
          createFileSystemError('mkdir', `not a directory: ${segments.slice(0, i).join('/')}`, {
            path,
            code: 'ENOTDIR',
          })
        )
      }

      let child = current.children.get(segment)

      if (!child) {
        child = this.createDirectory()
        current.children.set(segment, child)
      } else if (child.type !== 'directory') {
        return err(
          createFileSystemError('mkdir', `file exists: ${segments.slice(0, i + 1).join('/')}`, {
            path,
            code: 'EEXIST',
          })
        )
      }

      current = child
    }

    return ok(undefined)
  }

  /**
   * Synchronous file/directory removal
   */
  private removeSync(path: string): Result<void, FileSystemError> {
    const segments = this.splitPath(path)
    const filename = segments.pop()

    if (!filename) {
      return err(
        createFileSystemError('setFileContent', `invalid path: ${path}`, { path, code: 'EINVAL' })
      )
    }

    let current = this.root
    for (const segment of segments) {
      if (current.type !== 'directory' || !current.children) {
        return err(
          createFileSystemError('writeFile', `not a directory: ${segment}`, {
            path,
            code: 'ENOTDIR',
          })
        )
      }

      const child = current.children.get(segment)
      if (!child) {
        return err(
          createFileSystemError('readFile', `no such file or directory: ${path}`, {
            path,
            code: 'ENOENT',
          })
        )
      }

      current = child
    }

    if (current.type !== 'directory' || !current.children) {
      return err(
        createFileSystemError('writeFile', `parent is not a directory: ${path}`, {
          path,
          code: 'ENOTDIR',
        })
      )
    }

    if (!current.children.has(filename)) {
      return err(
        createFileSystemError('readFile', `no such file or directory: ${path}`, {
          path,
          code: 'ENOENT',
        })
      )
    }

    current.children.delete(filename)
    return ok(undefined)
  }

  /**
   * Sets the current working directory
   */
  setCwd(path: string): void {
    this.cwd = this.normalizePath(path)
  }

  /**
   * Gets the current working directory
   */
  getCwd(): string {
    return this.cwd
  }

  /**
   * Gets all files in the filesystem
   */
  getAllFiles(): Record<string, string> {
    const files: Record<string, string> = {}

    const traverse = (node: FSNode, path: string) => {
      if (node.type === 'file') {
        files[path] = node.content || ''
      } else if (node.type === 'directory' && node.children) {
        for (const [name, child] of node.children) {
          traverse(child, path === '/' ? `/${name}` : `${path}/${name}`)
        }
      }
    }

    traverse(this.root, '')
    return files
  }

  /**
   * Resets the filesystem
   */
  reset(): void {
    this.root = this.createDirectory()
  }

  /**
   * Checks if a path exists
   */
  exists(path: string): boolean {
    return this.findNode(path) !== null
  }

  /**
   * Gets file content
   */
  getFileContent(path: string): string | null {
    const node = this.findNode(path)
    return node && node.type === 'file' ? node.content || '' : null
  }

  /**
   * Sets file content
   */
  setFileContent(path: string, content: string): Result<void, FileSystemError> {
    return this.writeFileSync(path, content)
  }
}

/**
 * Creates a new mock filesystem
 *
 * @param initialFiles - Initial files to populate the filesystem with
 * @returns MockFileSystem instance ready for testing
 *
 * @example
 * ```typescript
 * const fs = createMockFileSystem({
 *   'config.json': '{}',
 *   'src/main.ts': 'console.log("hello")'
 * })
 *
 * // Use filesystem operations
 * const content = await fs.readFile('config.json')
 * ```
 */
export const createMockFileSystem = (initialFiles: Record<string, string> = {}): MockFileSystem => {
  return new MockFileSystem(initialFiles)
}

/**
 * Creates a mock filesystem with common test files
 *
 * @returns MockFileSystem populated with a typical project structure
 *
 * @example
 * ```typescript
 * const fs = createTestFileSystem()
 * // Includes package.json, README.md, src/, tests/ structure
 *
 * const packageJson = await fs.readFile('/package.json')
 * const srcFiles = await fs.readDir('/src')
 * ```
 */
export const createTestFileSystem = (): MockFileSystem => {
  return createMockFileSystem({
    '/package.json': JSON.stringify({ name: 'test-package', version: '1.0.0' }, null, 2),
    '/README.md': '# Test Package\n\nThis is a test package.',
    '/src/index.ts': 'export const hello = "world"',
    '/src/utils.ts': 'export const add = (a: number, b: number) => a + b',
    '/tests/index.test.ts':
      'import { hello } from "../src/index"\n\ntest("hello", () => {\n  expect(hello).toBe("world")\n})',
  })
}
