/**
 * Async testing utilities for Result types
 *
 * Helper functions for testing async operations that return Results.
 * Provides factories, transformers, and utilities for working with Promise<Result<T, E>>.
 *
 * @example
 * ```typescript
 * import { createAsyncOk, fromPromise, chainAsync } from '@trailhead/core/testing'
 *
 * // Create async Results
 * const asyncSuccess = createAsyncOk('value', 100) // resolves after 100ms
 * const asyncError = createAsyncErr('error', 50)
 *
 * // Convert Promises to Results
 * const result = await fromPromise(fetch('/api/data'))
 *
 * // Chain async operations
 * const chained = await chainAsync(result, async (data) => {
 *   return await processData(data)
 * })
 * ```
 */

import { ok, err, type Result } from '../errors/index.js'

/**
 * Creates an async Result that resolves to Ok
 *
 * @param value - The value to wrap in an Ok Result
 * @param delay - Delay in milliseconds before resolving (default: 0)
 * @returns Promise that resolves to Ok Result
 *
 * @example
 * ```typescript
 * const asyncResult = createAsyncOk('success', 1000)
 * const result = await asyncResult // Ok('success') after 1 second
 * ```
 */
export const createAsyncOk = <T>(value: T, delay = 0): Promise<Result<T, never>> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(ok(value)), delay)
  })
}

/**
 * Creates an async Result that resolves to Err
 *
 * @param error - The error to wrap in an Err Result
 * @param delay - Delay in milliseconds before resolving (default: 0)
 * @returns Promise that resolves to Err Result
 *
 * @example
 * ```typescript
 * const asyncError = createAsyncErr('failed', 500)
 * const result = await asyncError // Err('failed') after 500ms
 * ```
 */
export const createAsyncErr = <E>(error: E, delay = 0): Promise<Result<never, E>> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(err(error)), delay)
  })
}

/**
 * Creates an async operation that rejects (for testing Promise rejection)
 *
 * @param error - The error to reject with
 * @param delay - Delay in milliseconds before rejecting (default: 0)
 * @returns Promise that rejects with the error
 *
 * @example
 * ```typescript
 * const rejecting = createAsyncReject(new Error('network error'), 100)
 * try {
 *   await rejecting
 * } catch (err) {
 *   // Catches after 100ms
 * }
 * ```
 */
export const createAsyncReject = <T>(error: unknown, delay = 0): Promise<Result<T, never>> => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(error), delay)
  })
}

/**
 * Wraps a Promise in a Result
 */
export const fromPromise = async <T, E = Error>(promise: Promise<T>): Promise<Result<T, E>> => {
  try {
    const value = await promise
    return ok<T, E>(value)
  } catch (error) {
    return err<T, E>(error as E)
  }
}

/**
 * Wraps an async function in a Result
 */
export const fromAsyncThrowable = async <T, E = Error>(
  fn: () => Promise<T>
): Promise<Result<T, E>> => {
  try {
    const value = await fn()
    return ok<T, E>(value)
  } catch (error) {
    return err<T, E>(error as E)
  }
}

/**
 * Chains async Result operations
 */
export const chainAsync = async <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Promise<Result<U, E>>
): Promise<Result<U, E>> => {
  if (result.isOk()) {
    return fn(result.value)
  }
  return err<U, E>(result.error)
}

/**
 * Maps over an async Result value
 */
export const mapAsync = async <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Promise<U>
): Promise<Result<U, E>> => {
  if (result.isOk()) {
    try {
      const value = await fn(result.value)
      return ok<U, E>(value)
    } catch (error) {
      return err<U, E>(error as E)
    }
  }
  return err<U, E>(result.error)
}

/**
 * Combines multiple async Results
 */
export const combineAsync = async <T, E>(
  promises: Promise<Result<T, E>>[]
): Promise<Result<T[], E>> => {
  const results = await Promise.all(promises)
  const values: T[] = []

  for (const result of results) {
    if (result.isErr()) {
      return err(result.error)
    }
    values.push(result.value)
  }

  return ok(values)
}

/**
 * Races multiple async Results, returning the first to complete
 */
export const raceAsync = async <T, E>(promises: Promise<Result<T, E>>[]): Promise<Result<T, E>> => {
  return Promise.race(promises)
}

/**
 * Waits for all async Results, collecting successes and failures
 */
export const allSettledAsync = async <T, E>(
  promises: Promise<Result<T, E>>[]
): Promise<{
  successes: T[]
  failures: E[]
}> => {
  const results = await Promise.allSettled(promises)
  const successes: T[] = []
  const failures: E[] = []

  for (const result of results) {
    if (result.status === 'fulfilled') {
      if (result.value.isOk()) {
        successes.push(result.value.value)
      } else {
        failures.push(result.value.error)
      }
    } else {
      failures.push(result.reason)
    }
  }

  return { successes, failures }
}

/**
 * Creates a timeout wrapper for async Results
 */
export const withTimeout = async <T, E>(
  promise: Promise<Result<T, E>>,
  timeoutMs: number,
  timeoutError: E
): Promise<Result<T, E>> => {
  const timeoutPromise = new Promise<Result<T, E>>((resolve) => {
    setTimeout(() => resolve(err(timeoutError)), timeoutMs)
  })

  return Promise.race([promise, timeoutPromise])
}

/**
 * Retries an async operation with exponential backoff
 */
export const retryAsync = async <T, E>(
  fn: () => Promise<Result<T, E>>,
  maxRetries: number,
  baseDelay = 100
): Promise<Result<T, E>> => {
  let lastResult: Result<T, E> = err<T, E>(new Error('No attempts made') as E)

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    lastResult = await fn()

    if (lastResult.isOk()) {
      return lastResult
    }

    if (attempt < maxRetries) {
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  return lastResult
}

/**
 * Creates a batch processor for async Results
 */
export const processBatch = async <T, U, E>(
  items: T[],
  processor: (item: T) => Promise<Result<U, E>>,
  batchSize = 5
): Promise<Result<U[], E>> => {
  const results: U[] = []

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const promises = batch.map(processor)
    const batchResults = await Promise.all(promises)

    for (const result of batchResults) {
      if (result.isErr()) {
        return err(result.error)
      }
      results.push(result.value)
    }
  }

  return ok(results)
}

/**
 * Creates a mock async operation for testing
 */
export const createMockAsyncOperation = <T, E>(
  value: T,
  shouldFail = false,
  delay = 10,
  error?: E
): Promise<Result<T, E>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (shouldFail) {
        resolve(err<T, E>(error || (new Error('Mock error') as E)))
      } else {
        resolve(ok<T, E>(value))
      }
    }, delay)
  })
}
