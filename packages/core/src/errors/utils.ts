// Import neverthrow for re-exports
import { Result } from 'neverthrow'

// Direct neverthrow exports - use these patterns throughout the Trailhead ecosystem
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

// Convenience re-exports for static methods
export const combine = Result.combine
export const combineWithAllErrors = Result.combineWithAllErrors

/**
 * Extract a human-readable error message from any error type
 * Enhanced with proper type safety - no more 'as any'
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
 * Check if an error is recoverable
 */
export function isRecoverableError(error: { recoverable?: boolean }): boolean {
  return error.recoverable === true
}

/**
 * Extract error type for pattern matching
 */
export function getErrorType(error: { type?: string }): string {
  return error.type || 'unknown'
}

/**
 * Extract error category for categorization
 */
export function getErrorCategory(error: { category?: string }): string {
  return error.category || 'unknown'
}

// Performance-optimized type guards for zero-overhead validation

/**
 * Fast type guard for checking if a value is defined (not null or undefined)
 * Optimized for hot paths where performance matters
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

/**
 * Zero-overhead string validation for production builds
 * Uses compile-time optimizations when possible
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

/**
 * Performance-optimized object validation
 * Minimizes property access for better V8 optimization
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Fast array validation with optional length check
 * Optimized for frequent validation in data processing
 */
export function isNonEmptyArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0
}

/**
 * Compile-time conditional validation
 * Uses TypeScript's conditional types for zero runtime overhead
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
 * Production-optimized error checking
 * Avoids object property access in critical paths
 */
export function hasErrorShape(value: unknown): value is { type: string; message: string } {
  if (!isObject(value)) return false
  const obj = value as Record<string, unknown>
  return typeof obj.type === 'string' && typeof obj.message === 'string'
}
