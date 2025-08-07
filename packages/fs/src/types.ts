import type { Result, CoreError } from '@esteban-url/core'
import type { Order } from '@esteban-url/sort'

/**
 * File statistics information returned by stat operations.
 *
 * @example
 * ```typescript
 * const stats = await fs.stat('file.txt')
 * if (stats.isOk()) {
 *   console.log(`Size: ${stats.value.size} bytes`)
 *   console.log(`Is file: ${stats.value.isFile}`)
 *   console.log(`Modified: ${stats.value.mtime}`)
 * }
 * ```
 */
export interface FileStats {
  /** Size of the file in bytes */
  readonly size: number
  /** Whether the path points to a regular file */
  readonly isFile: boolean
  /** Whether the path points to a directory */
  readonly isDirectory: boolean
  /** Whether the path points to a symbolic link */
  readonly isSymbolicLink: boolean
  /** Last modification time */
  readonly mtime: Date
  /** Last access time */
  readonly atime: Date
  /** Creation time */
  readonly ctime: Date
  /** Optional file name */
  readonly name?: string
}

export type FileSortField = 'name' | 'size' | 'mtime' | 'atime' | 'ctime' | 'extension'

export interface FileSortOptions {
  readonly by: FileSortField
  readonly order?: Order
}

export interface SortOptions {
  readonly sort?: FileSortField | FileSortOptions | FileSortOptions[]
}

/**
 * Structured error type for all filesystem operations.
 * Extends CoreError with filesystem-specific context.
 *
 * @example
 * ```typescript
 * const result = await fs.readFile('missing.txt')
 * if (result.isErr()) {
 *   const error = result.error
 *   console.log(`Operation: ${error.operation}`)
 *   console.log(`Path: ${error.path}`)
 *   console.log(`Code: ${error.code}`) // e.g., 'ENOENT'
 *   console.log(`Suggestion: ${error.suggestion}`)
 * }
 * ```
 */
export interface FileSystemError extends CoreError {
  /** Error type identifier */
  readonly type: 'FILESYSTEM_ERROR'
  /** System error code (e.g., 'ENOENT', 'EACCES', 'EEXIST') */
  readonly code: string
  /** File or directory path that caused the error */
  readonly path?: string
  /** Component identifier */
  readonly component: 'filesystem'
  /** Operation that failed (e.g., 'Read file', 'Create directory') */
  readonly operation: string
  /** Error severity level */
  readonly severity: 'low' | 'medium' | 'high' | 'critical'
  /** Whether the error is recoverable (e.g., retry might succeed) */
  readonly recoverable: boolean
  /** When the error occurred */
  readonly timestamp: Date
}

/**
 * Options for copy operations.
 *
 * @example
 * ```typescript
 * // Copy a file
 * await fs.copy('source.txt', 'dest.txt', { overwrite: true })
 *
 * // Copy a directory recursively
 * await fs.copy('src/', 'dist/', { recursive: true, overwrite: true })
 * ```
 */
export interface CopyOptions {
  /** Whether to overwrite existing files (defaults to true) */
  readonly overwrite?: boolean
  /** Whether to copy directories recursively */
  readonly recursive?: boolean
}

/**
 * Options for move/rename operations.
 *
 * @example
 * ```typescript
 * // Move with overwrite protection
 * const result = await fs.move('old.txt', 'new.txt', { overwrite: false })
 * if (result.isErr() && result.error.code === 'EEXIST') {
 *   console.log('Destination already exists')
 * }
 * ```
 */
export interface MoveOptions {
  /** Whether to overwrite existing destination (defaults to true) */
  readonly overwrite?: boolean
}

/**
 * Options for directory creation.
 *
 * @example
 * ```typescript
 * // Create nested directories
 * await fs.mkdir('path/to/nested/dir', { recursive: true })
 * ```
 */
export interface MkdirOptions {
  /** Whether to create parent directories if they don't exist */
  readonly recursive?: boolean
}

/**
 * Options for remove operations.
 *
 * @example
 * ```typescript
 * // Remove directory and all contents
 * await fs.remove('temp/', { recursive: true, force: true })
 *
 * // Remove file only if it exists
 * await fs.remove('maybe-exists.txt', { force: true })
 * ```
 */
export interface RmOptions {
  /** Whether to remove directories and their contents recursively */
  readonly recursive?: boolean
  /** Whether to ignore non-existent files/directories (no error) */
  readonly force?: boolean
}

/**
 * Configuration options for filesystem operations.
 * Used with factory functions to create customized filesystem operations.
 *
 * @example
 * ```typescript
 * import { readFile, writeJson, FSConfig } from '@esteban-url/fs'
 *
 * const config: FSConfig = {
 *   encoding: 'utf16le',
 *   jsonSpaces: 4
 * }
 *
 * const customRead = readFile(config)
 * const customWriteJson = writeJson(config)
 * ```
 */
export interface FSConfig {
  /** Text encoding for read/write operations (defaults to 'utf8') */
  readonly encoding?: BufferEncoding
  /** Default file access mode for permission checks */
  readonly defaultMode?: number
  /** Number of spaces for JSON formatting (defaults to 2) */
  readonly jsonSpaces?: number
}

/**
 * Result type for all filesystem operations.
 * Wraps success values or FileSystemError for explicit error handling.
 *
 * @template T The type of the success value
 *
 * @example
 * ```typescript
 * function processFile(path: string): FSResult<string> {
 *   const result = await fs.readFile(path)
 *   if (result.isErr()) {
 *     return err(result.error)
 *   }
 *   return ok(result.value.toUpperCase())
 * }
 * ```
 */
export type FSResult<T> = Result<T, FileSystemError>

// Functional operation types

/**
 * Function type for reading file contents as string.
 * @param path File path to read
 * @returns Promise resolving to file contents or error
 */
export type ReadFileOp = (path: string) => Promise<FSResult<string>>

/**
 * Function type for writing string content to a file.
 * @param path File path to write to
 * @param content String content to write
 * @returns Promise resolving to void or error
 */
export type WriteFileOp = (path: string, content: string) => Promise<FSResult<void>>

/**
 * Function type for checking if a path exists.
 * @param path Path to check
 * @returns Promise resolving to boolean existence or error
 */
export type ExistsOp = (path: string) => Promise<FSResult<boolean>>

/**
 * Function type for getting file/directory statistics.
 * @param path Path to stat
 * @returns Promise resolving to FileStats or error
 */
export type StatOp = (path: string) => Promise<FSResult<FileStats>>

/**
 * Function type for creating directories.
 * @param path Directory path to create
 * @param options Creation options
 * @returns Promise resolving to void or error
 */
export type MkdirOp = (path: string, options?: MkdirOptions) => Promise<FSResult<void>>

/**
 * Function type for reading directory contents.
 * @param path Directory path to read
 * @returns Promise resolving to array of entry names or error
 */
export type ReadDirOp = (path: string) => Promise<FSResult<string[]>>

/**
 * Function type for copying files or directories.
 * @param src Source path
 * @param dest Destination path
 * @param options Copy options
 * @returns Promise resolving to void or error
 */
export type CopyOp = (src: string, dest: string, options?: CopyOptions) => Promise<FSResult<void>>

/**
 * Function type for moving/renaming files or directories.
 * @param src Source path
 * @param dest Destination path
 * @param options Move options
 * @returns Promise resolving to void or error
 */
export type MoveOp = (src: string, dest: string, options?: MoveOptions) => Promise<FSResult<void>>

/**
 * Function type for removing files or directories.
 * @param path Path to remove
 * @param options Remove options
 * @returns Promise resolving to void or error
 */
export type RemoveOp = (path: string, options?: RmOptions) => Promise<FSResult<void>>

/**
 * Function type for reading and parsing JSON files.
 * @template T The expected type of the parsed JSON
 * @param path JSON file path
 * @returns Promise resolving to parsed data or error
 */
export type ReadJsonOp = <T = any>(path: string) => Promise<FSResult<T>>

/**
 * Function type for writing data as JSON.
 * @template T The type of data to serialize
 * @param path File path to write to
 * @param data Data to serialize as JSON
 * @param options JSON formatting options
 * @returns Promise resolving to void or error
 */
export type WriteJsonOp = <T = any>(
  path: string,
  data: T,
  options?: { spaces?: number }
) => Promise<FSResult<void>>

/**
 * Options for finding files with patterns
 */
export interface FindFilesOptions {
  /** Working directory for the glob operation */
  readonly cwd?: string
  /** Patterns to ignore */
  readonly ignore?: string[]
  /** File patterns to match */
  readonly patterns?: string[]
  /** Whether to include directories in results */
  readonly includeDirs?: boolean
  /** Maximum depth to search */
  readonly maxDepth?: number
  /** Sorting options for results */
  readonly sort?: FileSortField | FileSortOptions | FileSortOptions[]
}

/**
 * Function type for finding files with glob patterns
 * @param pattern Glob pattern to match
 * @param options Find options with patterns and sorting
 * @returns Promise resolving to array of file paths or error
 */
export type FindFilesOp = (
  pattern: string,
  options?: FindFilesOptions
) => Promise<FSResult<string[]>>
