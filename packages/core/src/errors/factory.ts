import type { CoreError, ErrorContext } from './types.js'

/**
 * Foundation error factory - enhanced with better context
 */
export const createCoreError = (
  type: string,
  message: string,
  options?: {
    details?: string
    cause?: unknown
    suggestion?: string
    recoverable?: boolean
    context?: Record<string, unknown>
    component?: string
    operation?: string
    severity?: 'low' | 'medium' | 'high' | 'critical'
  }
): CoreError => ({
  type,
  message,
  details: options?.details,
  cause: options?.cause,
  suggestion: options?.suggestion,
  recoverable: options?.recoverable ?? false,
  context: options?.context,
  component: options?.component,
  operation: options?.operation,
  timestamp: new Date(),
  severity: options?.severity ?? 'medium',
})

/**
 * Add context to any error
 */
export const withContext = <E extends CoreError>(error: E, context: Partial<ErrorContext>): E => ({
  ...error,
  component: context.component ?? error.component,
  operation: context.operation ?? error.operation,
  timestamp: context.timestamp ?? error.timestamp ?? new Date(),
  details: [
    error.details,
    context.operation && `Operation: ${context.operation}`,
    context.component && `Component: ${context.component}`,
  ]
    .filter(Boolean)
    .join('\n'),
  context: {
    ...error.context,
    ...context,
  },
})

/**
 * Chain errors together for error propagation
 */
export const chainError = <E extends CoreError>(
  error: E,
  cause: CoreError | Error | unknown
): E => ({
  ...error,
  cause,
})
