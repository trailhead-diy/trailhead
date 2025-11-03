/**
 * @module errors/utils
 * @description Utility functions for Result-based error handling
 */

import { Result } from 'neverthrow'

/**
 * Direct neverthrow exports - use these patterns throughout the Trailhead ecosystem.
 *
 * @example
 * ```typescript
 * import { ok, err, Result } from '@trailhead/core'
 *
 * // Create success results
 * const success = ok(42)
 *
 * // Create error results
 * const failure = err('Something went wrong')
 *
 * // Handle promises
 * const result = await fromPromise(
 *   fetch('/api/user'),
 *   e => createCoreError('NetworkError', 'FETCH_FAILED', e.message)
 * )
 * ```
 */
export {
  // Core Result types and functions
  Result,
  ResultAsync,
  ok,
  err,
  okAsync,
  errAsync,

  // Utility functions
  fromThrowable,
  fromPromise,
  fromSafePromise,
  safeTry,
} from 'neverthrow'

/**
 * Combine multiple Results into a single Result.
 * If all Results are Ok, returns Ok with array of values.
 * If any Result is Err, returns the first Err.
 *
 * @example
 * ```typescript
 * const results = [ok(1), ok(2), ok(3)]
 * const combined = combine(results) // Ok([1, 2, 3])
 * ```
 */
export const combine = Result.combine

/**
 * Combine multiple Results, collecting all errors.
 * If all Results are Ok, returns Ok with array of values.
 * If any Result is Err, returns Err with array of all errors.
 *
 * @example
 * ```typescript
 * const results = [ok(1), err('error1'), err('error2')]
 * const combined = combineWithAllErrors(results) // Err(['error1', 'error2'])
 * ```
 */
export const combineWithAllErrors = Result.combineWithAllErrors

/**
 * Extract a human-readable error message from any error type.
 * Safely handles various error formats including Error objects, strings, and custom error types.
 *
 * @param error - The error to extract message from
 * @param defaultMessage - Message to use if extraction fails
 * @default defaultMessage - 'Unknown error'
 * @returns Human-readable error message
 *
 * @example
 * ```typescript
 * getErrorMessage(new Error('Failed')) // 'Failed'
 * getErrorMessage('String error') // 'String error'
 * getErrorMessage({ message: 'Custom' }) // 'Custom'
 * getErrorMessage(null) // 'Unknown error'
 * ```
 */
export function getErrorMessage(error: unknown, defaultMessage = 'Unknown error'): string {
  // Handle string errors directly
  if (typeof error === 'string') return error

  // Handle objects that might have a message property
  if (isObject(error)) {
    const errorObj = error as Record<string, unknown>
    if (typeof errorObj.message === 'string') return errorObj.message
  }

  // Handle Error instances
  if (error instanceof Error) return error.message

  // Handle objects with toString method (excluding plain objects)
  if (
    isObject(error) &&
    'toString' in error &&
    typeof error.toString === 'function' &&
    error.constructor !== Object
  ) {
    const stringified = String(error)
    if (stringified !== '[object Object]') return stringified
  }

  return defaultMessage
}

/**
 * Check if an error is recoverable through retry or user action.
 *
 * @param error - Error object with optional recoverable property
 * @returns true if the error is marked as recoverable
 *
 * @example
 * ```typescript
 * const error = { recoverable: true, message: 'Network timeout' }
 * if (isRecoverableError(error)) {
 *   // Retry the operation
 * }
 * ```
 */
export function isRecoverableError(error: { recoverable?: boolean }): boolean {
  return error.recoverable === true
}

/**
 * Extract error type for pattern matching and error categorization.
 *
 * @param error - Error object with optional type property
 * @returns Error type string or 'unknown' if not specified
 *
 * @example
 * ```typescript
 * const error = { type: 'ValidationError', message: 'Invalid input' }
 * switch (getErrorType(error)) {
 *   case 'ValidationError':
 *     // Handle validation error
 *     break
 *   case 'NetworkError':
 *     // Handle network error
 *     break
 * }
 * ```
 */
export function getErrorType(error: { type?: string }): string {
  return error.type || 'unknown'
}

/**
 * Extract error category for high-level error grouping.
 *
 * @param error - Error object with optional category property
 * @returns Error category string or 'unknown' if not specified
 *
 * @example
 * ```typescript
 * const error = { category: 'validation', type: 'InvalidInput' }
 * const category = getErrorCategory(error) // 'validation'
 * ```
 */
export function getErrorCategory(error: { category?: string }): string {
  return error.category || 'unknown'
}

/**
 * Type guard for checking if a value is defined (not null or undefined).
 * Use this to narrow types and handle optional values safely.
 *
 * @template T - The expected type when defined
 * @param value - Value to check
 * @returns Type predicate indicating if value is defined
 *
 * @example
 * ```typescript
 * const value: string | undefined = getUserInput()
 * if (isDefined(value)) {
 *   // TypeScript knows value is string here
 *   console.log(value.toUpperCase())
 * }
 * ```
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

/**
 * Type guard for non-empty string validation.
 * Checks both type and length in a single operation.
 *
 * @param value - Value to check
 * @returns Type predicate indicating if value is a non-empty string
 *
 * @example
 * ```typescript
 * const input: unknown = getUserInput()
 * if (isNonEmptyString(input)) {
 *   // TypeScript knows input is string here
 *   processString(input)
 * } else {
 *   return err('Input must be a non-empty string')
 * }
 * ```
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

/**
 * Type guard for object validation (excludes arrays and null).
 * Use this to safely access object properties.
 *
 * @param value - Value to check
 * @returns Type predicate indicating if value is a plain object
 *
 * @example
 * ```typescript
 * const data: unknown = JSON.parse(input)
 * if (isObject(data)) {
 *   // Safe to access properties
 *   const name = data.name
 * }
 * ```
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Type guard for non-empty array validation.
 * Ensures the value is an array with at least one element.
 *
 * @template T - The array element type
 * @param value - Value to check
 * @returns Type predicate indicating if value is a non-empty array
 *
 * @example
 * ```typescript
 * const items: unknown = getItems()
 * if (isNonEmptyArray<string>(items)) {
 *   // TypeScript knows items is string[] with length > 0
 *   const first = items[0] // Safe access
 * }
 * ```
 */
export function isNonEmptyArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0
}

/**
 * Compile-time type for validating input at the type level.
 * Returns true/false at compile time based on input type validity.
 *
 * @template T - The type to validate
 *
 * @example
 * ```typescript
 * type Valid1 = IsValidInput<'hello'> // true
 * type Valid2 = IsValidInput<''> // false
 * type Valid3 = IsValidInput<[1,2,3]> // true
 * type Valid4 = IsValidInput<[]> // false
 * type Valid5 = IsValidInput<null> // false
 * ```
 */
export type IsValidInput<T> = T extends string
  ? T extends ''
    ? false
    : true
  : T extends unknown[]
    ? T extends []
      ? false
      : true
    : T extends null | undefined
      ? false
      : true

/**
 * Type guard for checking if a value has the minimal error shape.
 * Useful for handling errors from external libraries.
 *
 * @param value - Value to check
 * @returns Type predicate indicating if value has error shape
 *
 * @example
 * ```typescript
 * try {
 *   someOperation()
 * } catch (error) {
 *   if (hasErrorShape(error)) {
 *     console.error(`${error.type}: ${error.message}`)
 *   } else {
 *     console.error('Unknown error:', error)
 *   }
 * }
 * ```
 */
export function hasErrorShape(value: unknown): value is { type: string; message: string } {
  if (!isObject(value)) return false
  const obj = value as Record<string, unknown>
  return typeof obj.type === 'string' && typeof obj.message === 'string'
}
