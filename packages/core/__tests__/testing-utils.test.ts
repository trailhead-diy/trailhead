import { describe, it, expect, vi } from 'vitest'
import { ok, err } from '../src/errors/index.js'
import {
  createAsyncOk,
  createAsyncErr,
  createAsyncReject,
  fromPromise,
  fromAsyncThrowable,
  chainAsync,
  mapAsync,
  combineAsync,
  allSettledAsync,
  withTimeout,
  retryAsync,
  processBatch,
  createMockAsyncOperation,
} from '../src/testing/async-helpers.js'
import {
  createTestError,
  createValidationError,
  createFsError,
  createNetworkError,
  createConfigError,
  createParseError,
  createTimeoutError,
  createAccessError,
  createNotFoundError,
  createConflictError,
  createErrorFactory,
  createMockError,
  createErrorChain,
  extractErrorChain,
  isTestError,
  hasErrorCode,
} from '../src/testing/error-factories.js'

describe('Testing Utilities - Async Helpers', () => {
  describe('createAsyncOk', () => {
    it('should create async Ok result', async () => {
      const result = await createAsyncOk('value')
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe('value')
      }
    })

    it('should delay resolution when specified', async () => {
      const start = Date.now()
      await createAsyncOk('value', 50)
      const elapsed = Date.now() - start
      expect(elapsed).toBeGreaterThanOrEqual(40)
    })
  })

  describe('createAsyncErr', () => {
    it('should create async Err result', async () => {
      const result = await createAsyncErr('error')
      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toBe('error')
      }
    })
  })

  describe('createAsyncReject', () => {
    it('should reject with error', async () => {
      await expect(createAsyncReject(new Error('rejected'))).rejects.toThrow('rejected')
    })
  })

  describe('fromPromise', () => {
    it('should convert resolved Promise to Ok', async () => {
      const result = await fromPromise(Promise.resolve('success'))
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe('success')
      }
    })

    it('should convert rejected Promise to Err', async () => {
      const result = await fromPromise(Promise.reject(new Error('failed')))
      expect(result.isErr()).toBe(true)
    })
  })

  describe('fromAsyncThrowable', () => {
    it('should wrap successful async function', async () => {
      const result = await fromAsyncThrowable(async () => 'value')
      expect(result.isOk()).toBe(true)
    })

    it('should wrap throwing async function', async () => {
      const result = await fromAsyncThrowable(async () => {
        throw new Error('async error')
      })
      expect(result.isErr()).toBe(true)
    })
  })

  describe('chainAsync', () => {
    it('should chain Ok results', async () => {
      const result = await chainAsync(ok(5), async (x) => ok(x * 2))
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(10)
      }
    })

    it('should propagate Err results', async () => {
      const result = await chainAsync(err('error'), async (x) => ok(x * 2))
      expect(result.isErr()).toBe(true)
    })
  })

  describe('mapAsync', () => {
    it('should map Ok values', async () => {
      const result = await mapAsync(ok(5), async (x) => x * 2)
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(10)
      }
    })

    it('should propagate Err values', async () => {
      const result = await mapAsync(err('error'), async (x) => x * 2)
      expect(result.isErr()).toBe(true)
    })

    it('should catch exceptions in mapper', async () => {
      const result = await mapAsync(ok(5), async () => {
        throw new Error('mapper error')
      })
      expect(result.isErr()).toBe(true)
    })
  })

  describe('combineAsync', () => {
    it('should combine all Ok results', async () => {
      const results = await combineAsync([
        Promise.resolve(ok(1)),
        Promise.resolve(ok(2)),
        Promise.resolve(ok(3)),
      ])
      expect(results.isOk()).toBe(true)
      if (results.isOk()) {
        expect(results.value).toEqual([1, 2, 3])
      }
    })

    it('should return first Err', async () => {
      const results = await combineAsync([
        Promise.resolve(ok(1)),
        Promise.resolve(err('error')),
        Promise.resolve(ok(3)),
      ])
      expect(results.isErr()).toBe(true)
    })
  })

  describe('allSettledAsync', () => {
    it('should collect successes and failures', async () => {
      const { successes, failures } = await allSettledAsync([
        Promise.resolve(ok(1)),
        Promise.resolve(err('error')),
        Promise.resolve(ok(2)),
      ])
      expect(successes).toEqual([1, 2])
      expect(failures).toEqual(['error'])
    })

    it('should handle rejected promises', async () => {
      const { failures } = await allSettledAsync([Promise.reject(new Error('rejected'))])
      expect(failures).toHaveLength(1)
    })
  })

  describe('withTimeout', () => {
    it('should return result if completed before timeout', async () => {
      const result = await withTimeout(createAsyncOk('value', 10), 100, 'timeout')
      expect(result.isOk()).toBe(true)
    })

    it('should return timeout error if exceeded', async () => {
      const result = await withTimeout(createAsyncOk('value', 100), 10, 'timeout')
      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toBe('timeout')
      }
    })
  })

  describe('retryAsync', () => {
    it('should succeed on first try', async () => {
      const fn = vi.fn().mockResolvedValue(ok('success'))
      const result = await retryAsync(fn, 3, 10)
      expect(result.isOk()).toBe(true)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure', async () => {
      let attempt = 0
      const fn = vi.fn().mockImplementation(async () => {
        attempt++
        if (attempt < 3) return err('failed')
        return ok('success')
      })
      const result = await retryAsync(fn, 3, 10)
      expect(result.isOk()).toBe(true)
      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('should return last error after max retries', async () => {
      const fn = vi.fn().mockResolvedValue(err('always fails'))
      const result = await retryAsync(fn, 2, 10)
      expect(result.isErr()).toBe(true)
      expect(fn).toHaveBeenCalledTimes(3) // initial + 2 retries
    })
  })

  describe('processBatch', () => {
    it('should process items in batches', async () => {
      const processor = vi.fn().mockImplementation(async (x: number) => ok(x * 2))
      const result = await processBatch([1, 2, 3, 4, 5], processor, 2)
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual([2, 4, 6, 8, 10])
      }
    })

    it('should fail fast on error', async () => {
      let count = 0
      const processor = vi.fn().mockImplementation(async (x: number) => {
        count++
        if (x === 3) return err('failed on 3')
        return ok(x)
      })
      const result = await processBatch([1, 2, 3, 4, 5], processor, 2)
      expect(result.isErr()).toBe(true)
      // Should process batch 1 (1,2) and batch 2 (3,4) before failing
      expect(count).toBeLessThanOrEqual(4)
    })
  })

  describe('createMockAsyncOperation', () => {
    it('should create successful mock operation', async () => {
      const result = await createMockAsyncOperation('value', false, 10)
      expect(result.isOk()).toBe(true)
    })

    it('should create failing mock operation', async () => {
      const result = await createMockAsyncOperation('value', true, 10)
      expect(result.isErr()).toBe(true)
    })
  })
})

describe('Testing Utilities - Error Factories', () => {
  describe('createTestError', () => {
    it('should create error with code and message', () => {
      const error = createTestError('CUSTOM_ERROR', 'Something went wrong')
      expect(error.code).toBe('CUSTOM_ERROR')
      expect(error.message).toBe('Something went wrong')
    })

    it('should include cause when provided', () => {
      const cause = new Error('original')
      const error = createTestError('CUSTOM_ERROR', 'Wrapper', cause)
      expect(error.cause).toBe(cause)
    })
  })

  describe('createValidationError', () => {
    it('should create validation error with field', () => {
      const error = createValidationError('is required', 'email')
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.message).toBe('email: is required')
    })

    it('should create validation error without field', () => {
      const error = createValidationError('Invalid format')
      expect(error.message).toBe('Invalid format')
    })
  })

  describe('createFsError', () => {
    it('should create filesystem error', () => {
      const error = createFsError('read', '/path/to/file')
      expect(error.code).toBe('FS_ERROR')
      expect(error.message).toBe('Failed to read /path/to/file')
    })
  })

  describe('createNetworkError', () => {
    it('should create network error with status', () => {
      const error = createNetworkError('Not Found', 404)
      expect(error.code).toBe('NETWORK_ERROR')
      expect(error.message).toBe('Not Found (404)')
      expect(error.cause).toEqual({ status: 404 })
    })

    it('should create network error without status', () => {
      const error = createNetworkError('Connection refused')
      expect(error.message).toBe('Connection refused')
    })
  })

  describe('createConfigError', () => {
    it('should create config error with key', () => {
      const error = createConfigError('invalid', 'database.port')
      expect(error.code).toBe('CONFIG_ERROR')
      expect(error.message).toContain('database.port')
    })
  })

  describe('createParseError', () => {
    it('should create parse error with position', () => {
      const error = createParseError('unexpected token', 42)
      expect(error.code).toBe('PARSE_ERROR')
      expect(error.message).toContain('position 42')
    })
  })

  describe('createTimeoutError', () => {
    it('should create timeout error', () => {
      const error = createTimeoutError('database query', 5000)
      expect(error.code).toBe('TIMEOUT_ERROR')
      expect(error.message).toContain('5000ms')
    })
  })

  describe('createAccessError', () => {
    it('should create access error', () => {
      const error = createAccessError('secret.txt', 'read')
      expect(error.code).toBe('ACCESS_ERROR')
      expect(error.message).toContain('cannot read')
    })
  })

  describe('createNotFoundError', () => {
    it('should create not found error', () => {
      const error = createNotFoundError('User', 'john@example.com')
      expect(error.code).toBe('NOT_FOUND')
      expect(error.message).toBe('User not found: john@example.com')
    })
  })

  describe('createConflictError', () => {
    it('should create conflict error', () => {
      const error = createConflictError('User', 'john@example.com')
      expect(error.code).toBe('CONFLICT')
      expect(error.message).toBe('User already exists: john@example.com')
    })
  })

  describe('createErrorFactory', () => {
    it('should create custom error factory', () => {
      const createApiError = createErrorFactory<{ endpoint: string; status: number }>(
        'NETWORK_ERROR',
        ({ endpoint, status }) => `API error at ${endpoint}: ${status}`
      )

      const error = createApiError({ endpoint: '/api/users', status: 500 })
      expect(error.code).toBe('NETWORK_ERROR')
      expect(error.message).toBe('API error at /api/users: 500')
    })
  })

  describe('createMockError', () => {
    it('should create mock error with default message', () => {
      const error = createMockError()
      expect(error.code).toBe('MOCK_ERROR')
      expect(error.message).toBe('Mock error')
    })

    it('should create mock error with custom message', () => {
      const error = createMockError('Custom mock')
      expect(error.message).toBe('Custom mock')
    })
  })

  describe('Error Chain Utilities', () => {
    it('should create error chain', () => {
      const chain = createErrorChain(['Primary error', 'Secondary error', 'Root cause'])
      expect(chain.code).toBe('CHAINED_ERROR')
      expect(chain.message).toBe('Primary error')
      expect(chain.cause).toBeDefined()
    })

    it('should extract error chain messages', () => {
      const chain = createErrorChain(['First', 'Second', 'Third'])
      const messages = extractErrorChain(chain)
      expect(messages).toEqual(['First', 'Second', 'Third'])
    })
  })

  describe('Type Guards', () => {
    it('should identify TestError', () => {
      const error = createTestError('CUSTOM_ERROR', 'test')
      expect(isTestError(error)).toBe(true)
    })

    it('should reject non-TestError objects', () => {
      expect(isTestError({ foo: 'bar' })).toBe(false)
      expect(isTestError(null)).toBe(false)
      expect(isTestError('string')).toBe(false)
    })

    it('should check error code', () => {
      const error = createValidationError('test')
      expect(hasErrorCode(error, 'VALIDATION_ERROR')).toBe(true)
      expect(hasErrorCode(error, 'FS_ERROR')).toBe(false)
    })
  })
})
