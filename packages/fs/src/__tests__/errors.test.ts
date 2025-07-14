import { describe, it, expect } from 'vitest'
import { createFileSystemError, mapNodeError } from '../errors.js'

describe('Filesystem Errors', () => {
  describe('createFileSystemError', () => {
    it('should create basic filesystem error', () => {
      const error = createFileSystemError('Read file', 'Operation failed')

      expect(error.type).toBe('FILESYSTEM_ERROR')
      expect(error.operation).toBe('Read file')
      expect(error.message).toBe('Operation failed')
      expect(error.recoverable).toBe(false) // default
    })

    it('should create error with all options', () => {
      const error = createFileSystemError('Write file', 'Write failed', {
        path: '/test/file.txt',
        code: 'ENOENT',
        cause: new Error('Original error'),
        suggestion: 'Check file path',
        recoverable: false,
        context: { customField: 'value' },
      })

      expect(error.type).toBe('FILESYSTEM_ERROR')
      expect(error.operation).toBe('Write file')
      expect(error.message).toBe('Write failed')
      expect(error.path).toBe('/test/file.txt')
      expect(error.code).toBe('ENOENT')
      expect(error.suggestion).toBe('Check file path')
      expect(error.recoverable).toBe(false)
      expect(error.cause).toBeInstanceOf(Error)
      expect(error.context).toEqual({
        operation: 'Write file',
        path: '/test/file.txt',
        code: 'ENOENT',
        customField: 'value',
      })
    })
  })

  describe('mapNodeError', () => {
    it('should map ENOENT error correctly', () => {
      const nodeError = { code: 'ENOENT', message: 'no such file or directory' }
      const error = mapNodeError('Read file', '/test/file.txt', nodeError)

      expect(error.type).toBe('FILESYSTEM_ERROR')
      expect(error.operation).toBe('Read file')
      expect(error.path).toBe('/test/file.txt')
      expect(error.code).toBe('ENOENT')
      expect(error.recoverable).toBe(true)
      expect(error.suggestion).toBe('Check if the path is correct and the file exists')
      expect(error.message).toBe(
        "Read file failed: File or directory '/test/file.txt' does not exist"
      )
    })

    it('should map EEXIST error correctly', () => {
      const nodeError = { code: 'EEXIST', message: 'file already exists' }
      const error = mapNodeError('Create directory', '/test/dir', nodeError)

      expect(error.code).toBe('EEXIST')
      expect(error.recoverable).toBe(true)
      expect(error.suggestion).toBe('Use a different path or enable overwrite option')
      expect(error.message).toBe(
        "Create directory failed: File or directory '/test/dir' already exists"
      )
    })

    it('should map EACCES error correctly', () => {
      const nodeError = { code: 'EACCES', message: 'permission denied' }
      const error = mapNodeError('Write file', '/test/file.txt', nodeError)

      expect(error.code).toBe('EACCES')
      expect(error.recoverable).toBe(false)
      expect(error.suggestion).toBe('Check file permissions and user access rights')
      expect(error.message).toBe("Write file failed: Permission denied for '/test/file.txt'")
    })

    it('should map EISDIR error correctly', () => {
      const nodeError = { code: 'EISDIR', message: 'illegal operation on a directory' }
      const error = mapNodeError('Read file', '/test/dir', nodeError)

      expect(error.code).toBe('EISDIR')
      expect(error.recoverable).toBe(true)
      expect(error.suggestion).toBe('Use a file path instead of directory path')
      expect(error.message).toBe("Read file failed: '/test/dir' is a directory")
    })

    it('should map ENOTDIR error correctly', () => {
      const nodeError = { code: 'ENOTDIR', message: 'not a directory' }
      const error = mapNodeError('Create file', '/test/file/child.txt', nodeError)

      expect(error.code).toBe('ENOTDIR')
      expect(error.recoverable).toBe(true)
      expect(error.suggestion).toBe('Check if parent directories exist and are valid')
      expect(error.message).toBe(
        "Create file failed: Part of path '/test/file/child.txt' is not a directory"
      )
    })

    it('should map EMFILE error correctly', () => {
      const nodeError = { code: 'EMFILE', message: 'too many open files' }
      const error = mapNodeError('Open file', '/test/file.txt', nodeError)

      expect(error.code).toBe('EMFILE')
      expect(error.recoverable).toBe(true)
      expect(error.suggestion).toBe('Close unused files or increase system limits')
      expect(error.message).toBe('Open file failed: Too many open files')
    })

    it('should map ENOSPC error correctly', () => {
      const nodeError = { code: 'ENOSPC', message: 'no space left on device' }
      const error = mapNodeError('Write file', '/test/file.txt', nodeError)

      expect(error.code).toBe('ENOSPC')
      expect(error.recoverable).toBe(false)
      expect(error.suggestion).toBe('Free up disk space')
      expect(error.message).toBe('Write file failed: No space left on device')
    })

    it('should map unknown error codes', () => {
      const nodeError = { code: 'UNKNOWN_ERROR', message: 'unknown error occurred' }
      const error = mapNodeError('Operation', '/test/path', nodeError)

      expect(error.code).toBe('UNKNOWN_ERROR')
      expect(error.recoverable).toBe(false)
      expect(error.suggestion).toBe('Check the error details and retry the operation')
      expect(error.message).toBe('Operation failed: unknown error occurred')
    })

    it('should handle errors without code', () => {
      const nodeError = { message: 'generic error' }
      const error = mapNodeError('Operation', '/test/path', nodeError)

      expect(error.code).toBe('FS_ERROR')
      expect(error.recoverable).toBe(false)
      expect(error.message).toBe('Operation failed: generic error')
    })

    it('should handle errors without message', () => {
      const nodeError = { code: 'ENOENT' }
      const error = mapNodeError('Operation', '/test/path', nodeError)

      expect(error.code).toBe('ENOENT')
      expect(error.message).toBe("Operation failed: File or directory '/test/path' does not exist")
    })

    it('should handle string errors', () => {
      const nodeError = 'string error'
      const error = mapNodeError('Operation', '/test/path', nodeError)

      expect(error.code).toBe('FS_ERROR')
      expect(error.message).toBe('Operation failed: string error')
      expect(error.recoverable).toBe(false)
    })
  })
})
