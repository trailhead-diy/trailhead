import { createErrorFactory } from '@trailhead/core'
import type { FileSystemError } from './types.js'

// Use standardized error factory from core
const createFSError = createErrorFactory('filesystem', 'high')

/**
 * Creates a structured FileSystemError with comprehensive context.
 * Used for custom error scenarios not covered by system errors.
 *
 * @param operation The filesystem operation that failed
 * @param message Human-readable error message
 * @param options Additional error context and metadata
 * @returns Structured FileSystemError
 *
 * @example
 * ```typescript
 * // Custom validation error
 * if (!isValidPath(path)) {
 *   return err(
 *     createFileSystemError('Validate path', 'Invalid characters in path', {
 *       path,
 *       code: 'INVALID_PATH',
 *       suggestion: 'Remove special characters from the path',
 *       recoverable: true
 *     })
 *   )
 * }
 *
 * // Permission check failure
 * return err(
 *   createFileSystemError('Check permissions', 'Insufficient permissions', {
 *     path: '/etc/passwd',
 *     code: 'EPERM',
 *     severity: 'critical',
 *     recoverable: false
 *   })
 * )
 * ```
 */
export const createFileSystemError = (
  operation: string,
  message: string,
  options?: {
    path?: string
    code?: string
    cause?: unknown
    suggestion?: string
    recoverable?: boolean
    severity?: 'low' | 'medium' | 'high' | 'critical'
    context?: Record<string, unknown>
  }
): FileSystemError => {
  const coreError = createFSError('FILESYSTEM_ERROR', options?.code || 'FS_ERROR', message, {
    operation,
    details: options?.path ? `Path: ${options.path}` : undefined,
    cause: options?.cause,
    suggestion: options?.suggestion,
    recoverable: options?.recoverable ?? false,
    severity: options?.severity || 'high',
    context: {
      operation,
      path: options?.path,
      ...options?.context,
    },
  })

  // Convert CoreError to FileSystemError with additional properties
  return {
    ...coreError,
    type: 'FILESYSTEM_ERROR' as const,
    path: options?.path,
  } as FileSystemError
}

/**
 * Maps Node.js system errors to structured FileSystemError instances.
 * Provides user-friendly messages and recovery suggestions for common errors.
 *
 * @param operation The filesystem operation that failed
 * @param path The file/directory path involved in the error
 * @param error The original Node.js error object
 * @returns Structured FileSystemError with context
 *
 * @example
 * ```typescript
 * try {
 *   await fs.readFile(path)
 * } catch (error) {
 *   // Maps ENOENT to user-friendly error
 *   return err(mapNodeError('Read file', path, error))
 *   // Returns: {
 *   //   message: "Read file failed: File or directory '/path' does not exist",
 *   //   code: 'ENOENT',
 *   //   suggestion: 'Check if the path is correct and the file exists',
 *   //   recoverable: true
 *   // }
 * }
 * ```
 *
 * @remarks
 * Handles common Node.js error codes:
 * - ENOENT: File/directory not found
 * - EEXIST: File/directory already exists
 * - EACCES: Permission denied
 * - EISDIR: Expected file but found directory
 * - ENOTDIR: Expected directory but found file
 * - EMFILE: Too many open files
 * - ENOSPC: No space left on device
 */
export const mapNodeError = (operation: string, path: string, error: any): FileSystemError => {
  const errorCode = error.code || 'FS_ERROR'
  let message: string
  let recoverable: boolean
  let suggestion: string | undefined

  switch (errorCode) {
    case 'ENOENT':
      message = `File or directory '${path}' does not exist`
      recoverable = true
      suggestion = 'Check if the path is correct and the file exists'
      break
    case 'EEXIST':
      message = `File or directory '${path}' already exists`
      recoverable = true
      suggestion = 'Use a different path or enable overwrite option'
      break
    case 'EACCES':
      message = `Permission denied for '${path}'`
      recoverable = false
      suggestion = 'Check file permissions and user access rights'
      break
    case 'EISDIR':
      message = `'${path}' is a directory`
      recoverable = true
      suggestion = 'Use a file path instead of directory path'
      break
    case 'ENOTDIR':
      message = `Part of path '${path}' is not a directory`
      recoverable = true
      suggestion = 'Check if parent directories exist and are valid'
      break
    case 'EMFILE':
      message = 'Too many open files'
      recoverable = true
      suggestion = 'Close unused files or increase system limits'
      break
    case 'ENOSPC':
      message = 'No space left on device'
      recoverable = false
      suggestion = 'Free up disk space'
      break
    default:
      message = error.message || String(error)
      recoverable = false
      suggestion = 'Check the error details and retry the operation'
  }

  return createFileSystemError(operation, `${operation} failed: ${message}`, {
    path,
    code: errorCode,
    cause: error,
    suggestion,
    recoverable,
  })
}
