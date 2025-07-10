// Import neverthrow for re-exports
import { Result } from 'neverthrow';

// Direct neverthrow exports - use these patterns throughout the codebase
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

// Convenience utilities for CLI error patterns
export function getErrorMessage<E = any>(error: E, defaultMessage = 'Unknown error'): string {
  const e = error as any;
  return e?.message || e?.toString() || defaultMessage;
}
