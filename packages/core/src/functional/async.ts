/**
 * @module functional/async
 * @description Utilities for converting Promises and async functions to Result types
 */

import { type Result, ResultAsync, err, ok } from 'neverthrow'
import type { CoreError } from '../errors/types.js'

/**
 * Convert a Promise to ResultAsync with automatic error handling.
 * This is the primary way to integrate async operations with Result types.
 *
 * @template T - The type of the successful value
 * @param promise - Promise to convert
 * @param errorHandler - Optional function to transform errors to CoreError
 * @returns ResultAsync that will resolve to Ok or Err
 *
 * @example
 * ```typescript
 * // Basic usage
 * const result = await fromPromise(
 *   fetch('/api/user'),
 *   error => createCoreError('NetworkError', 'FETCH_FAILED', error.message)
 * )
 *
 * // With default error handler
 * const data = await fromPromise(readFile('config.json'))
 *
 * // Chain with other operations
 * const user = await fromPromise(fetchUser(id))
 *   .andThen(user => fromPromise(enrichUser(user)))
 *   .map(user => user.name)
 * ```
 */
export const fromPromise = <T>(
  promise: Promise<T>,
  errorHandler?: (error: unknown) => CoreError
): ResultAsync<T, CoreError> => {
  return ResultAsync.fromPromise(
    promise,
    errorHandler ||
      ((error) =>
        ({
          type: 'ASYNC_ERROR',
          message: error instanceof Error ? error.message : 'Unknown async error',
          cause: error,
          recoverable: false,
        }) as CoreError)
  )
}

/**
 * Convert a function that might throw to a safe Result-returning function.
 * Wraps synchronous functions to catch exceptions.
 *
 * @template T - Return type of the function
 * @template Args - Arguments tuple type
 * @param fn - Function that might throw
 * @param errorHandler - Optional error transformer
 * @returns Safe function that returns Result instead of throwing
 *
 * @example
 * ```typescript
 * // Unsafe function that throws
 * const parseJSON = (text: string) => JSON.parse(text)
 *
 * // Make it safe
 * const safeParseJSON = fromThrowable(
 *   parseJSON,
 *   error => createCoreError('ParseError', 'INVALID_JSON', error.message)
 * )
 *
 * const result = safeParseJSON('{"valid": true}') // Ok({valid: true})
 * const error = safeParseJSON('invalid json') // Err(CoreError)
 * ```
 */
export const fromThrowable = <T, Args extends readonly unknown[]>(
  fn: (...args: Args) => T,
  errorHandler?: (error: unknown) => CoreError
): ((...args: Args) => Result<T, CoreError>) => {
  return (...args: Args): Result<T, CoreError> => {
    try {
      const result = fn(...args)
      return ok(result)
    } catch (error) {
      const coreError = errorHandler
        ? errorHandler(error)
        : ({
            type: 'THROWABLE_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
            cause: error,
            recoverable: false,
          } as CoreError)
      return err(coreError)
    }
  }
}

/**
 * Convert an async function that might throw to a safe ResultAsync-returning function.
 * This is essential for wrapping third-party async APIs.
 *
 * @template T - Return type of the async function
 * @template Args - Arguments tuple type
 * @param fn - Async function that might throw
 * @param errorHandler - Optional error transformer
 * @returns Safe async function that returns ResultAsync
 *
 * @example
 * ```typescript
 * // Unsafe async function
 * const fetchData = async (url: string) => {
 *   const response = await fetch(url)
 *   return response.json()
 * }
 *
 * // Make it safe
 * const safeFetchData = fromThrowableAsync(
 *   fetchData,
 *   error => createCoreError('FetchError', 'REQUEST_FAILED', error.message)
 * )
 *
 * // Use it
 * const result = await safeFetchData('https://api.example.com/data')
 * if (result.isOk()) {
 *   console.log('Data:', result.value)
 * } else {
 *   console.error('Error:', result.error.message)
 * }
 * ```
 */
export const fromThrowableAsync = <T, Args extends readonly unknown[]>(
  fn: (...args: Args) => Promise<T>,
  errorHandler?: (error: unknown) => CoreError
): ((...args: Args) => ResultAsync<T, CoreError>) => {
  return (...args: Args): ResultAsync<T, CoreError> => {
    return fromPromise(fn(...args), errorHandler)
  }
}
