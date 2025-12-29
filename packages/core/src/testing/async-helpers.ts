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
 * Wraps a Promise in a Result, catching rejections as errors.
 *
 * @template T - The type of the successful value
 * @template E - The error type (defaults to Error)
 * @param promise - The Promise to wrap
 * @returns Promise resolving to Ok with value or Err with caught error
 *
 * @example
 * ```typescript
 * const result = await fromPromise(fetch('/api/data'))
 * if (result.isOk()) {
 *   console.log('Response:', result.value)
 * }
 * ```
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
 * Wraps an async function in a Result, catching thrown errors.
 *
 * @template T - The type of the successful value
 * @template E - The error type (defaults to Error)
 * @param fn - The async function to execute and wrap
 * @returns Promise resolving to Ok with value or Err with caught error
 *
 * @example
 * ```typescript
 * const result = await fromAsyncThrowable(async () => {
 *   const response = await fetch('/api/data')
 *   return response.json()
 * })
 * ```
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
 * Chains async Result operations (flatMap for async Results).
 * If input Result is Ok, applies the function; if Err, short-circuits.
 *
 * @template T - Input value type
 * @template U - Output value type
 * @template E - Error type
 * @param result - The input Result to chain from
 * @param fn - Async function that returns a Result
 * @returns Promise resolving to the chained Result
 *
 * @example
 * ```typescript
 * const userResult = createOkResult({ id: '123' })
 * const postsResult = await chainAsync(userResult, async (user) => {
 *   return await fetchUserPosts(user.id)
 * })
 * ```
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
 * Maps over an async Result value with an async transformer function.
 * If input Result is Err, short-circuits and returns the error.
 *
 * @template T - Input value type
 * @template U - Output value type
 * @template E - Error type
 * @param result - The input Result to map over
 * @param fn - Async function to transform the value
 * @returns Promise resolving to Result with transformed value or original error
 *
 * @example
 * ```typescript
 * const result = createOkResult({ name: 'john' })
 * const mapped = await mapAsync(result, async (user) => {
 *   return user.name.toUpperCase()
 * })
 * // Result<'JOHN', never>
 * ```
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
 * Combines multiple async Results into a single Result containing an array.
 * Returns the first error encountered if any Result fails.
 *
 * @template T - Value type in each Result
 * @template E - Error type
 * @param promises - Array of Promises that resolve to Results
 * @returns Promise resolving to Result with array of values or first error
 *
 * @example
 * ```typescript
 * const results = await combineAsync([
 *   fetchUser('1'),
 *   fetchUser('2'),
 *   fetchUser('3')
 * ])
 * // Result<User[], Error>
 * ```
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
 * Races multiple async Results, returning the first to complete.
 * Useful for implementing timeout patterns or parallel execution with early exit.
 *
 * @template T - Value type
 * @template E - Error type
 * @param promises - Array of Promises to race
 * @returns Promise resolving to the first Result to settle
 *
 * @example
 * ```typescript
 * const result = await raceAsync([
 *   fetchFromPrimary(),
 *   fetchFromBackup(),
 *   createTimeoutResult(5000)
 * ])
 * ```
 */
export const raceAsync = async <T, E>(promises: Promise<Result<T, E>>[]): Promise<Result<T, E>> => {
  return Promise.race(promises)
}

/**
 * Waits for all async Results to settle, collecting both successes and failures.
 * Unlike combineAsync, this does not short-circuit on errors.
 *
 * @template T - Value type
 * @template E - Error type
 * @param promises - Array of Promises to await
 * @returns Object with separate arrays for successes and failures
 *
 * @example
 * ```typescript
 * const { successes, failures } = await allSettledAsync([
 *   validateUser(user1),
 *   validateUser(user2),
 *   validateUser(user3)
 * ])
 * console.log(`${successes.length} valid, ${failures.length} invalid`)
 * ```
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
 * Creates a timeout wrapper for async Results.
 * Returns the provided timeout error if the operation doesn't complete in time.
 *
 * @template T - Value type
 * @template E - Error type
 * @param promise - The Promise to wrap with timeout
 * @param timeoutMs - Timeout duration in milliseconds
 * @param timeoutError - Error to return on timeout
 * @returns Promise resolving to Result or timeout error
 *
 * @example
 * ```typescript
 * const result = await withTimeout(
 *   fetchData(),
 *   5000,
 *   createTimeoutError('fetchData', 5000)
 * )
 * ```
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
 * Retries an async operation with exponential backoff.
 * Continues retrying until success or max retries reached.
 *
 * @template T - Value type
 * @template E - Error type
 * @param fn - Async function to retry
 * @param maxRetries - Maximum number of retry attempts
 * @param baseDelay - Base delay in ms (doubles each retry), default 100
 * @returns Promise resolving to final Result (success or last error)
 *
 * @example
 * ```typescript
 * const result = await retryAsync(
 *   () => fetchWithFlakeyNetwork(),
 *   3,    // max 3 retries
 *   100   // 100ms, 200ms, 400ms delays
 * )
 * ```
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
 * Creates a batch processor for async Results.
 * Processes items in batches to limit concurrency, fails fast on first error.
 *
 * @template T - Input item type
 * @template U - Output value type
 * @template E - Error type
 * @param items - Array of items to process
 * @param processor - Async function to process each item
 * @param batchSize - Number of items to process concurrently, default 5
 * @returns Promise resolving to Result with all processed values or first error
 *
 * @example
 * ```typescript
 * const result = await processBatch(
 *   userIds,
 *   (id) => fetchUser(id),
 *   10  // process 10 at a time
 * )
 * ```
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
 * Creates a mock async operation for testing.
 * Configurable success/failure, delay, and custom error.
 *
 * @template T - Value type
 * @template E - Error type
 * @param value - Value to return on success
 * @param shouldFail - Whether the operation should fail, default false
 * @param delay - Delay before resolving in ms, default 10
 * @param error - Custom error to return on failure
 * @returns Promise resolving to Ok with value or Err with error
 *
 * @example
 * ```typescript
 * // Successful operation
 * const success = await createMockAsyncOperation({ id: '1' }, false, 50)
 *
 * // Failing operation
 * const failure = await createMockAsyncOperation(
 *   null,
 *   true,
 *   50,
 *   createTestError('NETWORK_ERROR', 'Connection failed')
 * )
 * ```
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
