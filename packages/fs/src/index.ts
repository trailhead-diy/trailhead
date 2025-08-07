/**
 * @module @esteban-url/fs
 *
 * Functional filesystem operations with Result types for safe error handling.
 * Provides a modern, type-safe alternative to Node.js fs module with explicit error handling.
 *
 * @example
 * ```typescript
 * import { fs } from '@esteban-url/fs'
 *
 * // Using the convenience object (pre-configured with defaults)
 * const result = await fs.readFile('config.json')
 * if (result.isOk()) {
 *   console.log(result.value)
 * } else {
 *   console.error(result.error.message)
 * }
 *
 * // Using factory functions for custom configuration
 * import { readFile, FSConfig } from '@esteban-url/fs'
 *
 * const customConfig: FSConfig = { encoding: 'latin1' }
 * const customRead = readFile(customConfig)
 * const result = await customRead('file.txt')
 * ```
 */

// Types
export type {
  FileStats,
  FileSystemError,
  CopyOptions,
  MoveOptions,
  MkdirOptions,
  RmOptions,
  FSConfig,
  FSResult,
  ReadFileOp,
  WriteFileOp,
  ExistsOp,
  StatOp,
  MkdirOp,
  ReadDirOp,
  CopyOp,
  MoveOp,
  RemoveOp,
  ReadJsonOp,
  WriteJsonOp,
} from './types.js'

// Error utilities
export { createFileSystemError, mapNodeError } from './errors.js'

// Core operations (with dependency injection)
export {
  defaultFSConfig,
  readFile,
  writeFile,
  exists,
  stat,
  mkdir,
  readDir,
  copy,
  move,
  remove,
  readJson,
  writeJson,
  ensureDir,
  outputFile,
  emptyDir,
  findFiles,
  readIfExists,
  copyIfExists,
} from './core.js'

// Import for convenience object
import {
  readFile,
  writeFile,
  exists,
  stat,
  mkdir,
  readDir,
  copy,
  move,
  remove,
  readJson,
  writeJson,
  ensureDir,
  outputFile,
  emptyDir,
  findFiles,
  readIfExists,
  copyIfExists,
} from './core.js'

/**
 * Pre-configured filesystem operations using default configuration.
 * Provides a drop-in replacement for common filesystem operations with Result-based error handling.
 *
 * All operations return Result<T, FileSystemError> for safe error handling without exceptions.
 *
 * @example
 * ```typescript
 * import { fs } from '@esteban-url/fs'
 *
 * // Read a file
 * const content = await fs.readFile('data.txt')
 * if (content.isOk()) {
 *   console.log(content.value)
 * }
 *
 * // Write JSON with proper error handling
 * const data = { name: 'test', version: '1.0.0' }
 * const result = await fs.writeJson('package.json', data)
 * if (result.isErr()) {
 *   console.error(`Failed to write: ${result.error.message}`)
 * }
 *
 * // Check if file exists
 * const exists = await fs.exists('config.json')
 * if (exists.isOk() && exists.value) {
 *   const config = await fs.readJson('config.json')
 * }
 * ```
 */
export const fs = {
  readFile: readFile(),
  writeFile: writeFile(),
  exists: exists(),
  stat: stat(),
  mkdir: mkdir(),
  readDir: readDir(),
  copy: copy(),
  move: move(),
  remove: remove(),
  readJson: readJson(),
  writeJson: writeJson(),
  ensureDir: ensureDir(),
  outputFile: outputFile(),
  emptyDir: emptyDir(),
  findFiles: findFiles(),
  readIfExists: readIfExists(),
  copyIfExists: copyIfExists(),
}

// Path utilities
export * from './utils/index.js'
