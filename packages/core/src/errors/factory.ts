import type { CoreError, ErrorContext } from './types.js'

/**
 * Foundation error factory - enhanced with strict type safety
 * BREAKING CHANGE: component, operation, and severity are now required
 */
export const createCoreError = (
  type: string,
  code: string,
  message: string,
  options?: {
    component?: string
    operation?: string
    severity?: 'low' | 'medium' | 'high' | 'critical'
    details?: string
    cause?: unknown
    suggestion?: string
    recoverable?: boolean
    context?: Record<string, unknown>
  }
): CoreError => ({
  type,
  code,
  message,
  details: options?.details,
  cause: options?.cause,
  suggestion: options?.suggestion,
  recoverable: options?.recoverable ?? false,
  context: options?.context,
  component: options?.component || 'unknown',
  operation: options?.operation || 'unknown',
  timestamp: new Date(),
  severity: options?.severity || 'medium',
})

/**
 * Add context to any error
 * Updated to handle required fields properly
 */
export const withContext = <E extends CoreError>(error: E, context: Partial<ErrorContext>): E => ({
  ...error,
  component: context.component ?? error.component,
  operation: context.operation ?? error.operation,
  timestamp: context.timestamp ?? error.timestamp,
  details: [
    error.details,
    context.operation && `Operation: ${context.operation}`,
    context.component && `Component: ${context.component}`,
  ]
    .filter(Boolean)
    .join('\n'),
  context: {
    ...error.context,
    ...context.metadata,
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

/**
 * Convenience factory for common error types with sensible defaults
 */
export const createCommonError = {
  validation: (
    code: string,
    message: string,
    component: string,
    operation: string,
    options?: {
      details?: string
      cause?: unknown
      suggestion?: string
      recoverable?: boolean
      context?: Record<string, unknown>
    }
  ): CoreError =>
    createCoreError('VALIDATION_ERROR', code, message, {
      component,
      operation,
      severity: 'medium',
      recoverable: true,
      ...options,
    }),

  filesystem: (
    code: string,
    message: string,
    component: string,
    operation: string,
    options?: {
      details?: string
      cause?: unknown
      suggestion?: string
      recoverable?: boolean
      context?: Record<string, unknown>
    }
  ): CoreError =>
    createCoreError('FILESYSTEM_ERROR', code, message, {
      component,
      operation,
      severity: 'high',
      recoverable: false,
      ...options,
    }),

  network: (
    code: string,
    message: string,
    component: string,
    operation: string,
    options?: {
      details?: string
      cause?: unknown
      suggestion?: string
      recoverable?: boolean
      context?: Record<string, unknown>
    }
  ): CoreError =>
    createCoreError('NETWORK_ERROR', code, message, {
      component,
      operation,
      severity: 'medium',
      recoverable: true,
      ...options,
    }),

  parsing: (
    code: string,
    message: string,
    component: string,
    operation: string,
    options?: {
      details?: string
      cause?: unknown
      suggestion?: string
      recoverable?: boolean
      context?: Record<string, unknown>
    }
  ): CoreError =>
    createCoreError('PARSING_ERROR', code, message, {
      component,
      operation,
      severity: 'medium',
      recoverable: true,
      ...options,
    }),
}
