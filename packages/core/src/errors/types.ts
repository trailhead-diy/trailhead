// Re-export core neverthrow types
import type { Result, ResultAsync } from 'neverthrow'
export type { Result, ResultAsync, Err as ErrType, Ok as OkType } from 'neverthrow'

// Foundation error interface - enhanced for better debugging and type safety
export interface CoreError {
  readonly type: string
  readonly code: string // BREAKING: Now required for better error categorization
  readonly message: string
  readonly details?: string
  readonly cause?: unknown
  readonly suggestion?: string
  readonly recoverable: boolean
  readonly context?: Record<string, unknown>
  // Enhanced debugging context - now required for better error tracking
  readonly component: string // BREAKING: Now required
  readonly operation: string // BREAKING: Now required
  readonly timestamp: Date // BREAKING: Now required
  readonly severity: 'low' | 'medium' | 'high' | 'critical' // BREAKING: Now required
}

// Convenience type aliases for Result types
export type CoreResult<T> = Result<T, CoreError>
export type CoreResultAsync<T> = ResultAsync<T, CoreError>

// Error context for enhanced debugging
export interface ErrorContext {
  readonly operation: string
  readonly component: string
  readonly timestamp: Date
  readonly metadata?: Record<string, unknown>
}
