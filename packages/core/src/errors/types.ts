// Re-export core neverthrow types
import type { Result, ResultAsync } from 'neverthrow'
export type { Result, ResultAsync, Err as ErrType, Ok as OkType } from 'neverthrow'

// Foundation error interface - enhanced for better debugging
export interface CoreError {
  readonly type: string
  readonly message: string
  readonly details?: string
  readonly cause?: unknown
  readonly suggestion?: string
  readonly recoverable: boolean
  readonly context?: Record<string, unknown>
  // Enhanced debugging context
  readonly component?: string
  readonly operation?: string
  readonly timestamp?: Date
  readonly severity?: 'low' | 'medium' | 'high' | 'critical'
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
