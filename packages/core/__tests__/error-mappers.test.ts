import { describe, it, expect } from 'vitest'
import {
  mapNodeError,
  mapLibraryError,
  mapValidationError,
  createCoreError,
  withContext,
  chainError,
  createErrorFactory,
} from '../src/errors/factory.js'

describe('Error Mappers', () => {
  describe('mapNodeError', () => {
    it('should map ENOENT error to file-not-found pattern', () => {
      const nodeError = Object.assign(new Error('ENOENT: no such file'), {
        code: 'ENOENT',
        path: '/test/file.txt',
      })

      const result = mapNodeError('config-loader', 'readConfig', '/test/file.txt', nodeError)

      expect(result.type).toBe('NodeError')
      expect(result.code).toBe('NODE_ERROR')
      expect(result.message).toBe('readConfig failed')
      expect(result.details).toContain('Path: /test/file.txt')
      expect(result.details).toContain('ENOENT')
      expect(result.cause).toBe(nodeError)
      expect(result.context?.operation).toBe('readConfig')
      expect(result.context?.path).toBe('/test/file.txt')
    })

    it('should map EACCES error and preserve permission context', () => {
      const nodeError = Object.assign(new Error('EACCES: permission denied'), {
        code: 'EACCES',
      })

      const result = mapNodeError('filesystem', 'writeFile', '/etc/hosts', nodeError)

      expect(result.type).toBe('NodeError')
      expect(result.details).toContain('EACCES')
      expect(result.details).toContain('/etc/hosts')
      expect(result.component).toBe('filesystem')
    })

    it('should map EEXIST error for file exists scenarios', () => {
      const nodeError = Object.assign(new Error('EEXIST: file already exists'), {
        code: 'EEXIST',
      })

      const result = mapNodeError('project-generator', 'createDir', '/projects/my-app', nodeError)

      expect(result.type).toBe('NodeError')
      expect(result.details).toContain('EEXIST')
      expect(result.operation).toBe('createDir')
    })

    it('should handle non-Error objects gracefully', () => {
      const result = mapNodeError('config', 'parse', '/config.json', 'string error')

      expect(result.type).toBe('NodeError')
      expect(result.details).toContain('string error')
      expect(result.cause).toBe('string error')
    })

    it('should handle null/undefined errors', () => {
      const result = mapNodeError('test', 'operation', '/path', null)

      expect(result.type).toBe('NodeError')
      expect(result.details).toContain('null')
    })
  })

  describe('mapLibraryError', () => {
    it('should wrap axios-like HTTP errors', () => {
      const axiosError = new Error('Request failed with status code 404')
      ;(axiosError as any).response = { status: 404 }

      const result = mapLibraryError('api-client', 'axios', 'fetchData', axiosError)

      expect(result.type).toBe('LibraryError')
      expect(result.code).toBe('LIBRARY_ERROR')
      expect(result.message).toBe('axios operation failed')
      expect(result.details).toContain('Library: axios')
      expect(result.details).toContain('fetchData')
      expect(result.context?.library).toBe('axios')
      expect(result.context?.operation).toBe('fetchData')
    })

    it('should preserve error context from prisma-like errors', () => {
      const prismaError = new Error('Record not found')
      ;(prismaError as any).code = 'P2025'

      const result = mapLibraryError('user-repository', 'prisma', 'findUnique', prismaError)

      expect(result.type).toBe('LibraryError')
      expect(result.details).toContain('prisma')
      expect(result.cause).toBe(prismaError)
    })

    it('should handle zod validation errors', () => {
      const zodError = new Error('Invalid input')
      ;(zodError as any).issues = [{ path: ['email'], message: 'Invalid email' }]

      const result = mapLibraryError('validator', 'zod', 'validateInput', zodError)

      expect(result.type).toBe('LibraryError')
      expect(result.details).toContain('zod')
      expect(result.operation).toBe('validateInput')
    })

    it('should handle string errors from libraries', () => {
      const result = mapLibraryError('parser', 'yaml', 'parse', 'YAML syntax error at line 5')

      expect(result.type).toBe('LibraryError')
      expect(result.details).toContain('YAML syntax error')
    })
  })

  describe('mapValidationError', () => {
    it('should map field validation failure with value context', () => {
      const error = new Error('Invalid email format')

      const result = mapValidationError('user-service', 'email', 'invalid-email', error)

      expect(result.type).toBe('ValidationError')
      expect(result.code).toBe('VALIDATION_ERROR')
      expect(result.message).toBe('Validation failed for field: email')
      expect(result.details).toContain('Field: email')
      expect(result.details).toContain('"invalid-email"')
      expect(result.context?.field).toBe('email')
      expect(result.context?.value).toBe('invalid-email')
    })

    it('should handle object values with JSON serialization', () => {
      const error = new Error('Invalid structure')
      const value = { nested: { key: 'value' } }

      const result = mapValidationError('config-validator', 'settings', value, error)

      expect(result.details).toContain('Value: {"nested":{"key":"value"}}')
    })

    it('should handle array values', () => {
      const error = new Error('Array too long')

      const result = mapValidationError('batch-validator', 'items', [1, 2, 3], error)

      expect(result.details).toContain('[1,2,3]')
    })

    it('should handle null and undefined values', () => {
      const error = new Error('Required field missing')

      const nullResult = mapValidationError('form', 'name', null, error)
      const undefinedResult = mapValidationError('form', 'age', undefined, error)

      expect(nullResult.details).toContain('null')
      expect(undefinedResult.details).toContain('undefined')
    })

    it('should handle circular reference in value gracefully', () => {
      const circularObj: any = { name: 'test' }
      circularObj.self = circularObj

      // JSON.stringify throws on circular references
      expect(() => {
        mapValidationError('test', 'circular', circularObj, new Error('test'))
      }).toThrow()
    })
  })

  describe('withContext', () => {
    it('should add context to existing error', () => {
      const error = createCoreError('TestError', 'TEST', 'Test message')

      const contextual = withContext(error, {
        component: 'test-component',
        operation: 'test-op',
      })

      expect(contextual.component).toBe('test-component')
      expect(contextual.operation).toBe('test-op')
    })

    it('should preserve original error fields', () => {
      const error = createCoreError('TestError', 'TEST', 'Test message', {
        recoverable: true,
        severity: 'high',
      })

      const contextual = withContext(error, { component: 'new-component' })

      expect(contextual.type).toBe('TestError')
      expect(contextual.message).toBe('Test message')
      expect(contextual.recoverable).toBe(true)
      expect(contextual.severity).toBe('high')
    })

    it('should add metadata to context object', () => {
      const error = createCoreError('TestError', 'TEST', 'Test message')

      const contextual = withContext(error, {
        metadata: { userId: '123', requestId: 'abc' },
      })

      expect(contextual.context?.userId).toBe('123')
      expect(contextual.context?.requestId).toBe('abc')
    })
  })

  describe('chainError', () => {
    it('should chain CoreError as cause', () => {
      const originalError = createCoreError('DbError', 'DB_CONN', 'Connection failed')
      const serviceError = createCoreError('ServiceError', 'USER_FETCH', 'Cannot fetch user')

      const chained = chainError(serviceError, originalError)

      expect(chained.type).toBe('ServiceError')
      expect(chained.cause).toBe(originalError)
    })

    it('should chain native Error as cause', () => {
      const nativeError = new Error('Network timeout')
      const appError = createCoreError('NetworkError', 'TIMEOUT', 'Request timed out')

      const chained = chainError(appError, nativeError)

      expect(chained.cause).toBe(nativeError)
    })

    it('should chain string as cause', () => {
      const appError = createCoreError('TestError', 'TEST', 'Test')

      const chained = chainError(appError, 'string cause')

      expect(chained.cause).toBe('string cause')
    })
  })

  describe('createErrorFactory', () => {
    it('should create factory with default component', () => {
      const createAppError = createErrorFactory('my-app')

      const error = createAppError('CustomError', 'CUSTOM', 'Custom error message')

      expect(error.component).toBe('my-app')
      expect(error.type).toBe('CustomError')
      expect(error.code).toBe('CUSTOM')
    })

    it('should use default severity when not specified', () => {
      const createAppError = createErrorFactory('my-app', 'high')

      const error = createAppError('Error', 'ERR', 'Message')

      expect(error.severity).toBe('high')
    })

    it('should allow overriding severity per error', () => {
      const createAppError = createErrorFactory('my-app', 'medium')

      const error = createAppError('Error', 'ERR', 'Message', { severity: 'critical' })

      expect(error.severity).toBe('critical')
    })

    it('should set recoverable to true by default', () => {
      const createAppError = createErrorFactory('my-app')

      const error = createAppError('Error', 'ERR', 'Message')

      expect(error.recoverable).toBe(true)
    })

    it('should allow overriding recoverable', () => {
      const createAppError = createErrorFactory('my-app')

      const error = createAppError('Error', 'ERR', 'Message', { recoverable: false })

      expect(error.recoverable).toBe(false)
    })
  })
})
