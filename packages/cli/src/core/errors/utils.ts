import type { Result } from './types.js'

/**
 * Type guard to check if a Result is successful
 */
export function isOk<T, E = any>(result: Result<T, E>): result is { success: true; value: T } {
  return result.success === true
}

/**
 * Type guard to check if a Result is an error
 */
export function isErr<T, E = any>(result: Result<T, E>): result is { success: false; error: E } {
  return result.success === false
}

/**
 * Unwrap a Result, throwing if it's an error
 */
export function unwrap<T, E = any>(result: Result<T, E>): T {
  if (!result.success) {
    throw new Error((result.error as any).message || 'Result is an error')
  }
  return result.value
}

/**
 * Unwrap a Result with a default value
 */
export function unwrapOr<T, E = any>(result: Result<T, E>, defaultValue: T): T {
  return result.success ? result.value : defaultValue
}

/**
 * Map over a successful Result
 */
export function map<T, U, E = any>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  if (!result.success) {
    return result
  }
  return { success: true, value: fn(result.value) }
}

/**
 * Map over an error Result
 */
export function mapErr<T, E = any, F = any>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  if (result.success) {
    return result
  }
  return { success: false, error: fn(result.error) }
}
