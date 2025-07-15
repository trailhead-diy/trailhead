/**
 * Result type testing utilities
 *
 * Helper functions for testing Result types in a functional programming context.
 * Provides factories, assertions, and utilities for working with neverthrow Results in tests.
 *
 * @example
 * ```typescript
 * import { createOkResult, assertOk, unwrapOk } from '@esteban-url/core/testing'
 *
 * // Create test Results
 * const successResult = createOkResult('test-value')
 * const errorResult = createErrResult('test-error')
 *
 * // Assert Result types
 * assertOk(successResult) // throws if Err
 * assertErr(errorResult)  // throws if Ok
 *
 * // Extract values safely
 * const value = unwrapOk(successResult) // 'test-value'
 * const error = unwrapErr(errorResult)  // 'test-error'
 * ```
 */

import {
  ok,
  err,
  fromThrowable,
  combine,
  combineWithAllErrors as neverthrowCombineWithAllErrors,
  type Result,
} from '../errors/index.js'

/**
 * Creates a Result from a function that may throw
 * Uses neverthrow's built-in fromThrowable utility
 *
 * @example
 * ```typescript
 * const parseJson = createResultFromThrowable((str: string) => JSON.parse(str))
 * const result = parseJson('{"key": "value"}')
 * // Result<any, Error>
 * ```
 */
export const createResultFromThrowable = fromThrowable

/**
 * Creates a successful Result for testing
 *
 * @param value - The value to wrap in an Ok Result
 * @returns A successful Result containing the value
 *
 * @example
 * ```typescript
 * const result = createOkResult('success')
 * expect(result.isOk()).toBe(true)
 * expect(result.value).toBe('success')
 * ```
 */
export const createOkResult = <T>(value: T): Result<T, never> => ok(value)

/**
 * Creates a failed Result for testing
 *
 * @param error - The error to wrap in an Err Result
 * @returns A failed Result containing the error
 *
 * @example
 * ```typescript
 * const result = createErrResult('failed')
 * expect(result.isErr()).toBe(true)
 * expect(result.error).toBe('failed')
 * ```
 */
export const createErrResult = <E>(error: E): Result<never, E> => err(error)

/**
 * Extracts the value from an Ok Result, throwing if Err
 * Uses neverthrow's built-in _unsafeUnwrap method
 *
 * @param result - The Result to unwrap
 * @returns The value from the Ok Result
 * @throws Error if the Result is Err
 *
 * @example
 * ```typescript
 * const okResult = createOkResult('value')
 * const value = unwrapOk(okResult) // 'value'
 *
 * const errResult = createErrResult('error')
 * // unwrapOk(errResult) // throws Error
 * ```
 */
export const unwrapOk = <T, E>(result: Result<T, E>): T => {
  return result._unsafeUnwrap()
}

/**
 * Extracts the error from an Err Result, throwing if Ok
 * Uses neverthrow's built-in _unsafeUnwrapErr method
 *
 * @param result - The Result to unwrap
 * @returns The error from the Err Result
 * @throws Error if the Result is Ok
 *
 * @example
 * ```typescript
 * const errResult = createErrResult('error')
 * const error = unwrapErr(errResult) // 'error'
 *
 * const okResult = createOkResult('value')
 * // unwrapErr(okResult) // throws Error
 * ```
 */
export const unwrapErr = <T, E>(result: Result<T, E>): E => {
  return result._unsafeUnwrapErr()
}

/**
 * Asserts that a Result is Ok (type guard)
 *
 * @param result - The Result to check
 * @throws Error if the Result is Err
 *
 * @example
 * ```typescript
 * const result = someOperation()
 * assertOk(result)
 * // TypeScript now knows result is Ok<T, never>
 * console.log(result.value) // TypeScript knows this is safe
 * ```
 */
export const assertOk = <T, E>(result: Result<T, E>): asserts result is Result<T, never> => {
  if (result.isErr()) {
    const errorDisplay =
      typeof result.error === 'object' && result.error !== null
        ? JSON.stringify(result.error, null, 2)
        : String(result.error)
    throw new Error(
      `Expected Ok but got Err:\n${errorDisplay}\n\nResult path: ${getResultPath(result)}`
    )
  }
}

/**
 * Asserts that a Result is Err (type guard)
 *
 * @param result - The Result to check
 * @throws Error if the Result is Ok
 *
 * @example
 * ```typescript
 * const result = someOperation()
 * assertErr(result)
 * // TypeScript now knows result is Err<never, E>
 * console.log(result.error) // TypeScript knows this is safe
 * ```
 */
export const assertErr = <T, E>(result: Result<T, E>): asserts result is Result<never, E> => {
  if (result.isOk()) {
    const valueDisplay =
      typeof result.value === 'object' && result.value !== null
        ? JSON.stringify(result.value, null, 2)
        : String(result.value)
    throw new Error(
      `Expected Err but got Ok:\n${valueDisplay}\n\nResult path: ${getResultPath(result)}`
    )
  }
}

/**
 * Checks if a Result is Ok (type predicate)
 *
 * @param result - The Result to check
 * @returns true if the Result is Ok, false otherwise
 *
 * @example
 * ```typescript
 * const result = someOperation()
 * if (isOk(result)) {
 *   // TypeScript knows result is Ok<T, never>
 *   console.log(result.value)
 * }
 * ```
 */
export const isOk = <T, E>(result: Result<T, E>): result is Result<T, never> => result.isOk()

/**
 * Checks if a Result is Err (type predicate)
 *
 * @param result - The Result to check
 * @returns true if the Result is Err, false otherwise
 *
 * @example
 * ```typescript
 * const result = someOperation()
 * if (isErr(result)) {
 *   // TypeScript knows result is Err<never, E>
 *   console.log(result.error)
 * }
 * ```
 */
export const isErr = <T, E>(result: Result<T, E>): result is Result<never, E> => result.isErr()

/**
 * Maps over a Result value for testing
 *
 * @param result - The Result to map over
 * @param fn - Function to apply to the Ok value
 * @returns New Result with transformed value
 *
 * @example
 * ```typescript
 * const result = createOkResult(5)
 * const doubled = mapResult(result, x => x * 2)
 * // Result<10, never>
 * ```
 */
export const mapResult = <T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> => {
  return result.map(fn)
}

/**
 * Maps over a Result error for testing
 *
 * @param result - The Result to map over
 * @param fn - Function to apply to the Err value
 * @returns New Result with transformed error
 *
 * @example
 * ```typescript
 * const result = createErrResult('failed')
 * const enhanced = mapError(result, err => `Error: ${err}`)
 * // Result<never, 'Error: failed'>
 * ```
 */
export const mapError = <T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> => {
  return result.mapErr(fn)
}

/**
 * Chains Result operations for testing (flatMap)
 *
 * @param result - The Result to chain from
 * @param fn - Function that returns a Result
 * @returns Flattened Result from the chain
 *
 * @example
 * ```typescript
 * const result = createOkResult('5')
 * const parsed = chainResult(result, str => {
 *   const num = parseInt(str)
 *   return isNaN(num) ? createErrResult('invalid') : createOkResult(num)
 * })
 * // Result<5, 'invalid'>
 * ```
 */
export const chainResult = <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> => {
  return result.andThen(fn)
}

/**
 * Combines multiple Results into a single Result
 * Uses neverthrow's built-in combine utility
 *
 * @param results - Array of Results to combine
 * @returns Result containing array of values, or first error
 *
 * @example
 * ```typescript
 * const results = [
 *   createOkResult(1),
 *   createOkResult(2),
 *   createOkResult(3)
 * ]
 * const combined = combineResults(results)
 * // Result<[1, 2, 3], never>
 * ```
 */
export const combineResults = combine

/**
 * Combines multiple Results, collecting all errors
 * Uses neverthrow's built-in combineWithAllErrors utility
 *
 * @param results - Array of Results to combine
 * @returns Result containing array of values, or array of all errors
 *
 * @example
 * ```typescript
 * const results = [
 *   createOkResult(1),
 *   createErrResult('error1'),
 *   createErrResult('error2')
 * ]
 * const combined = combineWithAllErrors(results)
 * // Result<never, ['error1', 'error2']>
 * ```
 */
export const combineWithAllErrors = neverthrowCombineWithAllErrors

/**
 * Creates a Result matcher for testing patterns (pattern matching)
 *
 * @param onOk - Function to call if Result is Ok
 * @param onErr - Function to call if Result is Err
 * @returns A function that matches on the Result
 *
 * @example
 * ```typescript
 * const matcher = createResultMatcher(
 *   value => console.log('Success:', value),
 *   error => console.log('Error:', error)
 * )
 *
 * const result = someOperation()
 * matcher(result) // Calls appropriate handler
 * ```
 */
export const createResultMatcher =
  <T, E>(onOk: (value: T) => void, onErr: (error: E) => void) =>
  (result: Result<T, E>): void => {
    if (result.isOk()) {
      onOk(result.value)
    } else {
      onErr(result.error)
    }
  }

/**
 * Gets a debug path for a Result to help trace where it came from
 *
 * @param result - The Result to get a path for
 * @returns A string describing the Result's type and origin
 */
const getResultPath = <T, E>(result: Result<T, E>): string => {
  if (result.isOk()) {
    return `Ok(${typeof result.value})`
  } else {
    const errorType =
      result.error && typeof result.error === 'object' && 'code' in result.error
        ? (result.error as any).code
        : typeof result.error
    return `Err(${errorType})`
  }
}
