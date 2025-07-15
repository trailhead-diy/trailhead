/**
 * Async Utilities Tests - High-ROI Testing
 *
 * Tests focus on:
 * - Promise to Result conversion patterns
 * - Error handling and transformation
 * - Type safety with generic functions
 * - Integration with existing Result types
 */

import { describe, it, expect, vi } from 'vitest'
import { ok, err } from 'neverthrow'
import { fromPromise, fromThrowable, fromThrowableAsync } from './async.js'
import type { CoreError } from '../errors/types.js'

describe('Async Utilities - Promise to Result Conversion', () => {
  describe('fromPromise', () => {
    it('should convert successful promise to Ok result', async () => {
      const promise = Promise.resolve('success')

      const resultAsync = fromPromise(promise)
      const result = await resultAsync

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe('success')
      }
    })

    it('should convert rejected promise to Err result with default error handler', async () => {
      const error = new Error('Test error')
      const promise = Promise.reject(error)

      const resultAsync = fromPromise(promise)
      const result = await resultAsync

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('ASYNC_ERROR')
        expect(result.error.message).toBe('Test error')
        expect(result.error.cause).toBe(error)
        expect(result.error.recoverable).toBe(false)
      }
    })

    it('should use custom error handler when provided', async () => {
      const customError: CoreError = {
        type: 'CUSTOM_ERROR',
        message: 'Custom error message',
        cause: undefined,
        recoverable: true,
      }

      const errorHandler = vi.fn().mockReturnValue(customError)
      const promise = Promise.reject(new Error('Original error'))

      const resultAsync = fromPromise(promise, errorHandler)
      const result = await resultAsync

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toEqual(customError)
      }
      expect(errorHandler).toHaveBeenCalledWith(expect.any(Error))
    })

    it('should handle non-Error rejections', async () => {
      const promise = Promise.reject('string error')

      const resultAsync = fromPromise(promise)
      const result = await resultAsync

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toBe('Unknown async error')
        expect(result.error.cause).toBe('string error')
      }
    })

    it('should preserve type information', async () => {
      interface TestData {
        id: number
        name: string
      }

      const data: TestData = { id: 1, name: 'test' }
      const promise = Promise.resolve(data)

      const resultAsync = fromPromise(promise)
      const result = await resultAsync

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        // TypeScript should infer correct type
        expect(result.value.id).toBe(1)
        expect(result.value.name).toBe('test')
      }
    })
  })

  describe('fromThrowable', () => {
    it('should convert successful function to Ok result', () => {
      const fn = (x: number, y: number) => x + y
      const safeFn = fromThrowable(fn)

      const result = safeFn(2, 3)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(5)
      }
    })

    it('should convert throwing function to Err result with default error handler', () => {
      const fn = () => {
        throw new Error('Function error')
      }
      const safeFn = fromThrowable(fn)

      const result = safeFn()

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('THROWABLE_ERROR')
        expect(result.error.message).toBe('Function error')
        expect(result.error.recoverable).toBe(false)
      }
    })

    it('should use custom error handler when provided', () => {
      const customError: CoreError = {
        type: 'PARSE_ERROR',
        message: 'Invalid input format',
        cause: undefined,
        recoverable: true,
      }

      const errorHandler = vi.fn().mockReturnValue(customError)
      const fn = () => {
        throw new Error('Parse failed')
      }
      const safeFn = fromThrowable(fn, errorHandler)

      const result = safeFn()

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toEqual(customError)
      }
      expect(errorHandler).toHaveBeenCalledWith(expect.any(Error))
    })

    it('should handle non-Error throws', () => {
      const fn = () => {
        throw 'string error'
      }
      const safeFn = fromThrowable(fn)

      const result = safeFn()

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toBe('Unknown error')
        expect(result.error.cause).toBe('string error')
      }
    })

    it('should preserve function arguments and types', () => {
      const fn = (name: string, age: number) => ({ name, age })
      const safeFn = fromThrowable(fn)

      const result = safeFn('Alice', 30)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.name).toBe('Alice')
        expect(result.value.age).toBe(30)
      }
    })

    it('should handle functions with multiple arguments', () => {
      const fn = (a: number, b: string, c: boolean) => `${a}-${b}-${c}`
      const safeFn = fromThrowable(fn)

      const result = safeFn(42, 'test', true)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe('42-test-true')
      }
    })
  })

  describe('fromThrowableAsync', () => {
    it('should convert successful async function to Ok result', async () => {
      const asyncFn = async (x: number) => x * 2
      const safeAsyncFn = fromThrowableAsync(asyncFn)

      const resultAsync = safeAsyncFn(5)
      const result = await resultAsync

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(10)
      }
    })

    it('should convert throwing async function to Err result', async () => {
      const asyncFn = async () => {
        throw new Error('Async error')
      }
      const safeAsyncFn = fromThrowableAsync(asyncFn)

      const resultAsync = safeAsyncFn()
      const result = await resultAsync

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('ASYNC_ERROR')
        expect(result.error.message).toBe('Async error')
      }
    })

    it('should use custom error handler when provided', async () => {
      const customError: CoreError = {
        type: 'NETWORK_ERROR',
        message: 'Connection failed',
        cause: undefined,
        recoverable: true,
      }

      const errorHandler = vi.fn().mockReturnValue(customError)
      const asyncFn = async () => {
        throw new Error('Network timeout')
      }
      const safeAsyncFn = fromThrowableAsync(asyncFn, errorHandler)

      const resultAsync = safeAsyncFn()
      const result = await resultAsync

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toEqual(customError)
      }
      expect(errorHandler).toHaveBeenCalledWith(expect.any(Error))
    })

    it('should handle async functions with multiple arguments', async () => {
      const asyncFn = async (base: number, multiplier: number) => {
        await new Promise((resolve) => setTimeout(resolve, 1)) // Simulate async work
        return base * multiplier
      }
      const safeAsyncFn = fromThrowableAsync(asyncFn)

      const resultAsync = safeAsyncFn(4, 7)
      const result = await resultAsync

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(28)
      }
    })

    it('should preserve type information for complex return types', async () => {
      interface ApiResponse {
        data: string[]
        status: number
      }

      const asyncFn = async (): Promise<ApiResponse> => {
        return { data: ['item1', 'item2'], status: 200 }
      }
      const safeAsyncFn = fromThrowableAsync(asyncFn)

      const resultAsync = safeAsyncFn()
      const result = await resultAsync

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.status).toBe(200)
        expect(result.value.data).toEqual(['item1', 'item2'])
      }
    })
  })
})

describe('Integration Scenarios', () => {
  it('should chain async operations safely', async () => {
    const parseJson = fromThrowable(JSON.parse)
    const fetchData = fromThrowableAsync(async (url: string) => {
      if (!url.startsWith('http')) {
        throw new Error('Invalid URL')
      }
      return '{"id": 1, "name": "test"}'
    })

    // Chain operations using Result methods
    const resultAsync = fetchData('https://api.example.com/data').andThen((jsonString) => {
      const parseResult = parseJson(jsonString)
      return parseResult.isOk() ? ok(parseResult.value) : err(parseResult.error)
    })

    const result = await resultAsync

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.id).toBe(1)
      expect(result.value.name).toBe('test')
    }
  })

  it('should handle complex error transformation scenarios', async () => {
    const networkErrorHandler = (error: unknown): CoreError => ({
      type: 'NETWORK_ERROR',
      message: 'Failed to fetch data',
      cause: error,
      recoverable: true,
    })

    const parseErrorHandler = (error: unknown): CoreError => ({
      type: 'PARSE_ERROR',
      message: 'Invalid data format',
      cause: error,
      recoverable: false,
    })

    const fetchData = fromThrowableAsync(async (shouldFail: boolean) => {
      if (shouldFail) {
        throw new Error('Network error')
      }
      return 'invalid json{'
    }, networkErrorHandler)

    const parseData = fromThrowable(JSON.parse, parseErrorHandler)

    // Test network error
    const networkResult = await fetchData(true)
    expect(networkResult.isErr()).toBe(true)
    if (networkResult.isErr()) {
      expect(networkResult.error.type).toBe('NETWORK_ERROR')
      expect(networkResult.error.recoverable).toBe(true)
    }

    // Test parse error
    const fetchResult = await fetchData(false)
    if (fetchResult.isOk()) {
      const parseResult = parseData(fetchResult.value)
      expect(parseResult.isErr()).toBe(true)
      if (parseResult.isErr()) {
        expect(parseResult.error.type).toBe('PARSE_ERROR')
        expect(parseResult.error.recoverable).toBe(false)
      }
    }
  })

  it('should work with real-world file operations', async () => {
    // Simulate file reading that can fail
    const readFile = fromThrowableAsync(async (path: string) => {
      if (path === 'missing.txt') {
        throw new Error('ENOENT: no such file or directory')
      }
      return 'file contents'
    })

    const processFile = fromThrowable((content: string) => {
      return content.toUpperCase()
    })

    // Success case
    const successResult = await readFile('valid.txt').andThen((content) => {
      const processResult = processFile(content)
      return processResult.isOk() ? ok(processResult.value) : err(processResult.error)
    })

    expect(successResult.isOk()).toBe(true)
    if (successResult.isOk()) {
      expect(successResult.value).toBe('FILE CONTENTS')
    }

    // Error case
    const errorResult = await readFile('missing.txt')
    expect(errorResult.isErr()).toBe(true)
    if (errorResult.isErr()) {
      expect(errorResult.error.message).toContain('ENOENT')
    }
  })

  it('should handle concurrent async operations', async () => {
    const asyncOperation = fromThrowableAsync(async (delay: number, shouldFail: boolean) => {
      await new Promise((resolve) => setTimeout(resolve, delay))
      if (shouldFail) {
        throw new Error(`Operation failed after ${delay}ms`)
      }
      return `Completed after ${delay}ms`
    })

    // Run operations concurrently
    const operations = [
      asyncOperation(10, false),
      asyncOperation(20, false),
      asyncOperation(5, true), // This one will fail
    ]

    const results = await Promise.all(operations)

    expect(results[0].isOk()).toBe(true)
    expect(results[1].isOk()).toBe(true)
    expect(results[2].isErr()).toBe(true)

    if (results[0].isOk()) {
      expect(results[0].value).toBe('Completed after 10ms')
    }
    if (results[2].isErr()) {
      expect(results[2].error.message).toContain('Operation failed after 5ms')
    }
  })
})
