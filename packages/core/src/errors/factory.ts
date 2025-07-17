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
 * Creates a standardized error factory function for a specific domain
 * This eliminates the need for each package to define its own error creation patterns
 */
export const createErrorFactory = (
  component: string,
  defaultSeverity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
) => {
  return (
    type: string,
    code: string,
    message: string,
    options?: {
      operation?: string
      details?: string
      cause?: unknown
      context?: Record<string, unknown>
      recoverable?: boolean
      severity?: 'low' | 'medium' | 'high' | 'critical'
      suggestion?: string
    }
  ): CoreError => {
    return createCoreError(type, code, message, {
      component,
      operation: options?.operation || 'process',
      severity: options?.severity || defaultSeverity,
      details: options?.details,
      cause: options?.cause,
      context: options?.context,
      recoverable: options?.recoverable ?? true,
      suggestion: options?.suggestion,
    })
  }
}

/**
 * Common error factories for shared use across packages
 */
export const createDataError = createErrorFactory('data', 'medium')
export const createFileSystemError = createErrorFactory('filesystem', 'high')
export const createValidationError = createErrorFactory('validation', 'medium')
export const createConfigError = createErrorFactory('config', 'medium')
export const createGitError = createErrorFactory('git', 'medium')
export const createCliError = createErrorFactory('cli', 'medium')

/**
 * Common error mapping utilities
 */
export const mapNodeError = (
  component: string,
  operation: string,
  path: string,
  error: unknown
): CoreError => {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorFactory = createErrorFactory(component)

  return errorFactory('NodeError', 'NODE_ERROR', `${operation} failed`, {
    operation,
    details: `Path: ${path}, Error: ${errorMessage}`,
    cause: error,
    context: { operation, path },
  })
}

export const mapLibraryError = (
  component: string,
  library: string,
  operation: string,
  error: unknown
): CoreError => {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorFactory = createErrorFactory(component)

  return errorFactory('LibraryError', 'LIBRARY_ERROR', `${library} operation failed`, {
    operation,
    details: `Library: ${library}, Operation: ${operation}, Error: ${errorMessage}`,
    cause: error,
    context: { library, operation },
  })
}

export const mapValidationError = (
  component: string,
  field: string,
  value: unknown,
  error: unknown
): CoreError => {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorFactory = createErrorFactory(component)

  return errorFactory(
    'ValidationError',
    'VALIDATION_ERROR',
    `Validation failed for field: ${field}`,
    {
      operation: 'validate',
      details: `Field: ${field}, Value: ${JSON.stringify(value)}, Error: ${errorMessage}`,
      cause: error,
      context: { field, value },
    }
  )
}
