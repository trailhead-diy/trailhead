/**
 * @module errors/types
 * @description Core type definitions for Result-based error handling
 */

import type { Result, ResultAsync } from 'neverthrow'

/**
 * Re-exported Result type from neverthrow for explicit error handling.
 * @template T - The success value type
 * @template E - The error value type
 * @see {@link https://github.com/supermacro/neverthrow#result Result documentation}
 */
export type { Result } from 'neverthrow'

/**
 * Re-exported ResultAsync type for asynchronous operations with explicit error handling.
 * @template T - The success value type
 * @template E - The error value type
 * @see {@link https://github.com/supermacro/neverthrow#resultasync ResultAsync documentation}
 */
export type { ResultAsync } from 'neverthrow'

/**
 * Re-exported error and success type guards
 */
export type { Err as ErrType, Ok as OkType } from 'neverthrow'

/**
 * Foundation error interface providing comprehensive error information.
 * All errors in the Trailhead ecosystem should implement this interface.
 *
 * @example
 * ```typescript
 * const error: CoreError = {
 *   type: 'ValidationError',
 *   code: 'INVALID_INPUT',
 *   message: 'Username must be at least 3 characters',
 *   component: 'user-service',
 *   operation: 'validateUsername',
 *   timestamp: new Date(),
 *   severity: 'medium',
 *   recoverable: true,
 *   suggestion: 'Please provide a longer username'
 * }
 * ```
 *
 * @since 0.1.0
 */
export interface CoreError {
  /** Error type for categorization (e.g., 'ValidationError', 'NetworkError') */
  readonly type: string

  /** Unique error code for programmatic handling (e.g., 'INVALID_INPUT', 'TIMEOUT') */
  readonly code: string

  /** Human-readable error message */
  readonly message: string

  /** Additional error details for debugging */
  readonly details?: string

  /** Original error that caused this error */
  readonly cause?: unknown

  /** Helpful suggestion for error recovery */
  readonly suggestion?: string

  /** Whether the error is recoverable through retry or user action */
  readonly recoverable: boolean

  /** Additional context data for debugging */
  readonly context?: Record<string, unknown>

  /** Component where the error occurred */
  readonly component: string

  /** Operation that was being performed when error occurred */
  readonly operation: string

  /** When the error occurred */
  readonly timestamp: Date

  /** Error severity level for prioritization */
  readonly severity: 'low' | 'medium' | 'high' | 'critical'
}

/**
 * Convenience type alias for Result with CoreError as the error type.
 * This is the standard return type for all Trailhead operations.
 *
 * @template T - The success value type
 *
 * @example
 * ```typescript
 * function readConfig(): CoreResult<Config> {
 *   // Returns either Ok<Config> or Err<CoreError>
 * }
 * ```
 */
export type CoreResult<T> = Result<T, CoreError>

/**
 * Convenience type alias for async Result with CoreError as the error type.
 * Use this for all asynchronous operations in Trailhead.
 *
 * @template T - The success value type
 *
 * @example
 * ```typescript
 * function fetchUser(id: string): CoreResultAsync<User> {
 *   // Returns ResultAsync that resolves to either Ok<User> or Err<CoreError>
 * }
 * ```
 */
export type CoreResultAsync<T> = ResultAsync<T, CoreError>

/**
 * Error context for enhanced debugging information.
 * Used to add contextual information when propagating errors.
 *
 * @example
 * ```typescript
 * const context: ErrorContext = {
 *   operation: 'saveUser',
 *   component: 'user-repository',
 *   timestamp: new Date(),
 *   metadata: { userId: '123', attempt: 1 }
 * }
 * ```
 */
export interface ErrorContext {
  /** The operation being performed */
  readonly operation: string

  /** The component performing the operation */
  readonly component: string

  /** When the operation was performed */
  readonly timestamp: Date

  /** Additional metadata about the operation */
  readonly metadata?: Record<string, unknown>
}
