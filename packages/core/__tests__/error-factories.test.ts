import { describe, it, expect } from 'vitest'
import {
  createCoreError,
  createErrorFactory,
  createDataError,
  createGitError,
  createCliError,
  createFileSystemError,
  createValidationError,
  createConfigError,
  mapNodeError,
  mapLibraryError,
  mapValidationError,
} from '../src/errors/factory.js'

describe('Error Factories', () => {
  describe('createErrorFactory', () => {
    it('should create factory with specified component', () => {
      const createMyError = createErrorFactory('my-component', 'high')
      const error = createMyError('TestError', 'TEST_CODE', 'Test message')

      expect(error.component).toBe('my-component')
      expect(error.severity).toBe('high')
    })

    it('should use default severity when not specified', () => {
      const createMyError = createErrorFactory('my-component')
      const error = createMyError('TestError', 'TEST_CODE', 'Test message')

      expect(error.severity).toBe('medium')
    })

    it('should allow overriding defaults in individual errors', () => {
      const createMyError = createErrorFactory('my-component', 'low')
      const error = createMyError('TestError', 'TEST_CODE', 'Test message', {
        severity: 'critical',
        operation: 'customOperation',
      })

      expect(error.severity).toBe('critical')
      expect(error.operation).toBe('customOperation')
    })

    it('should default recoverable to true for factory-created errors', () => {
      const createMyError = createErrorFactory('my-component')
      const error = createMyError('TestError', 'TEST_CODE', 'Test message')

      expect(error.recoverable).toBe(true)
    })

    it('should default operation to process', () => {
      const createMyError = createErrorFactory('my-component')
      const error = createMyError('TestError', 'TEST_CODE', 'Test message')

      expect(error.operation).toBe('process')
    })
  })

  describe('Pre-configured Error Factories', () => {
    describe('createDataError', () => {
      it('should create error with component=data', () => {
        const error = createDataError('ParseError', 'INVALID_JSON', 'Failed to parse JSON')

        expect(error.component).toBe('data')
        expect(error.severity).toBe('medium')
        expect(error.type).toBe('ParseError')
        expect(error.code).toBe('INVALID_JSON')
        expect(error.message).toBe('Failed to parse JSON')
      })

      it('should accept additional options', () => {
        const error = createDataError('ParseError', 'INVALID_JSON', 'Failed', {
          operation: 'parseFile',
          context: { filename: 'test.json' },
        })

        expect(error.operation).toBe('parseFile')
        expect(error.context).toEqual({ filename: 'test.json' })
      })
    })

    describe('createGitError', () => {
      it('should create error with component=git', () => {
        const error = createGitError(
          'GitError',
          'UNCOMMITTED_CHANGES',
          'Working directory not clean'
        )

        expect(error.component).toBe('git')
        expect(error.severity).toBe('medium')
        expect(error.type).toBe('GitError')
        expect(error.code).toBe('UNCOMMITTED_CHANGES')
      })
    })

    describe('createCliError', () => {
      it('should create error with component=cli', () => {
        const error = createCliError('ArgumentError', 'MISSING_ARG', 'Required --file not provided')

        expect(error.component).toBe('cli')
        expect(error.severity).toBe('medium')
        expect(error.type).toBe('ArgumentError')
      })
    })

    describe('createFileSystemError', () => {
      it('should create error with component=filesystem and severity=high', () => {
        const error = createFileSystemError('ReadError', 'FILE_NOT_FOUND', 'Config file missing')

        expect(error.component).toBe('filesystem')
        expect(error.severity).toBe('high')
      })
    })

    describe('createValidationError', () => {
      it('should create error with component=validation', () => {
        const error = createValidationError('ValidationError', 'INVALID_FORMAT', 'Invalid email')

        expect(error.component).toBe('validation')
        expect(error.severity).toBe('medium')
      })
    })

    describe('createConfigError', () => {
      it('should create error with component=config', () => {
        const error = createConfigError('ConfigError', 'MISSING_REQUIRED', 'API key not set')

        expect(error.component).toBe('config')
        expect(error.severity).toBe('medium')
      })
    })
  })

  describe('Error Mappers', () => {
    describe('mapNodeError', () => {
      it('should map Node.js error to CoreError format', () => {
        const nodeError = new Error('ENOENT: no such file or directory')
        const error = mapNodeError('config-loader', 'readConfig', '/path/to/file', nodeError)

        expect(error.type).toBe('NodeError')
        expect(error.code).toBe('NODE_ERROR')
        expect(error.component).toBe('config-loader')
        expect(error.operation).toBe('readConfig')
        expect(error.details).toContain('/path/to/file')
        expect(error.cause).toBe(nodeError)
      })

      it('should handle non-Error objects', () => {
        const error = mapNodeError('loader', 'read', '/path', 'string error')

        expect(error.details).toContain('string error')
      })
    })

    describe('mapLibraryError', () => {
      it('should map library error to CoreError format', () => {
        const axiosError = new Error('Network Error')
        const error = mapLibraryError('api-client', 'axios', 'fetchData', axiosError)

        expect(error.type).toBe('LibraryError')
        expect(error.code).toBe('LIBRARY_ERROR')
        expect(error.message).toContain('axios operation failed')
        expect(error.details).toContain('axios')
        expect(error.details).toContain('fetchData')
        expect(error.context).toEqual({ library: 'axios', operation: 'fetchData' })
      })
    })

    describe('mapValidationError', () => {
      it('should map validation error to CoreError format', () => {
        const validationError = new Error('Invalid format')
        const error = mapValidationError('user-service', 'email', 'invalid@', validationError)

        expect(error.type).toBe('ValidationError')
        expect(error.code).toBe('VALIDATION_ERROR')
        expect(error.message).toContain('email')
        expect(error.details).toContain('email')
        expect(error.details).toContain('invalid@')
        expect(error.context).toEqual({ field: 'email', value: 'invalid@' })
      })
    })
  })

  describe('Error Structure', () => {
    it('should include timestamp on all errors', () => {
      const error = createDataError('TestError', 'TEST', 'Test')
      expect(error.timestamp).toBeInstanceOf(Date)
    })

    it('should preserve all optional fields', () => {
      const error = createDataError('TestError', 'TEST', 'Test message', {
        details: 'More info',
        suggestion: 'Try this instead',
        cause: new Error('Original error'),
        context: { key: 'value' },
        recoverable: false,
      })

      expect(error.details).toBe('More info')
      expect(error.suggestion).toBe('Try this instead')
      expect(error.cause).toBeInstanceOf(Error)
      expect(error.context).toEqual({ key: 'value' })
      expect(error.recoverable).toBe(false)
    })
  })
})
