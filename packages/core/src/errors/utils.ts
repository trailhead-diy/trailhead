// Import neverthrow for re-exports
import { Result } from 'neverthrow';

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
} from 'neverthrow';

// Convenience re-exports for static methods
export const combine = Result.combine;
export const combineWithAllErrors = Result.combineWithAllErrors;

/**
 * Extract a human-readable error message from any error type
 */
export function getErrorMessage<E = any>(error: E, defaultMessage = 'Unknown error'): string {
  const e = error as any;
  if (e?.message) return e.message;
  if (typeof e === 'string') return e;
  if (e?.toString && typeof e.toString === 'function' && e.toString() !== '[object Object]') {
    return e.toString();
  }
  return defaultMessage;
}

/**
 * Check if an error is recoverable
 */
export function isRecoverableError(error: { recoverable?: boolean }): boolean {
  return error.recoverable === true;
}

/**
 * Extract error type for pattern matching
 */
export function getErrorType(error: { type?: string }): string {
  return error.type || 'unknown';
}

/**
 * Extract error category for categorization
 */
export function getErrorCategory(error: { category?: string }): string {
  return error.category || 'unknown';
}
