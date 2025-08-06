/**
 * @module errors/factory
 * @description Factory functions for creating standardized errors
 */

import type { CoreError, ErrorContext } from './types.js'

/**
 * Create a CoreError with all required fields.
 * This is the primary way to create errors in the Trailhead ecosystem.
 *
 * @param type - Error type for categorization (e.g., 'ValidationError')
 * @param code - Unique error code (e.g., 'INVALID_INPUT')
 * @param message - Human-readable error message
 * @param options - Additional error properties
 * @returns Fully formed CoreError object
 *
 * @example
 * ```typescript
 * const error = createCoreError(
 *   'ValidationError',
 *   'INVALID_EMAIL',
 *   'Email address is not valid',
 *   {
 *     component: 'user-service',
 *     operation: 'validateEmail',
 *     severity: 'medium',
 *     details: 'Email must contain @ symbol',
 *     suggestion: 'Please enter a valid email address',
 *     recoverable: true
 *   }
 * )
 * ```
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
 * Add or update context information on an existing error.
 * Useful for adding context as errors propagate up the call stack.
 *
 * @template E - Error type extending CoreError
 * @param error - The error to add context to
 * @param context - Context information to add/update
 * @returns Error with updated context
 *
 * @example
 * ```typescript
 * const originalError = createCoreError('DatabaseError', 'CONNECTION_FAILED', 'Cannot connect')
 *
 * // Add context as error propagates
 * const contextualError = withContext(originalError, {
 *   component: 'user-repository',
 *   operation: 'findUserById',
 *   metadata: { userId: '123', attempt: 1 }
 * })
 * ```
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
 * Chain errors together to maintain error causality.
 * Use this when an error causes another error.
 *
 * @template E - Error type extending CoreError
 * @param error - The new error
 * @param cause - The original error that caused this error
 * @returns Error with cause attached
 *
 * @example
 * ```typescript
 * const dbError = createCoreError('DatabaseError', 'CONNECTION_FAILED', 'Cannot connect')
 * const serviceError = createCoreError('ServiceError', 'USER_FETCH_FAILED', 'Cannot fetch user')
 *
 * // Chain errors to maintain causality
 * const chainedError = chainError(serviceError, dbError)
 * // Now serviceError.cause contains dbError
 * ```
 */
export const chainError = <E extends CoreError>(
  error: E,
  cause: CoreError | Error | unknown
): E => ({
  ...error,
  cause,
})

/**
 * Create a domain-specific error factory with preset defaults.
 * This ensures consistent error creation across a component or module.
 *
 * @param component - The component name to use for all errors
 * @param defaultSeverity - Default severity level if not specified
 * @returns Error factory function for the component
 *
 * @example
 * ```typescript
 * // In user-service.ts
 * const createUserError = createErrorFactory('user-service', 'medium')
 *
 * // Use throughout the service
 * const validationError = createUserError(
 *   'ValidationError',
 *   'INVALID_USERNAME',
 *   'Username contains invalid characters',
 *   { operation: 'validateUsername', recoverable: true }
 * )
 * ```
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
 * Pre-configured error factory for data-related errors.
 * @example
 * ```typescript
 * const error = createDataError('ParseError', 'INVALID_JSON', 'Failed to parse JSON')
 * ```
 */
export const createDataError = createErrorFactory('data', 'medium')

/**
 * Pre-configured error factory for filesystem operations.
 * Default severity is 'high' as filesystem errors often impact functionality.
 * @example
 * ```typescript
 * const error = createFileSystemError('ReadError', 'FILE_NOT_FOUND', 'Config file missing')
 * ```
 */
export const createFileSystemError = createErrorFactory('filesystem', 'high')

/**
 * Pre-configured error factory for validation errors.
 * @example
 * ```typescript
 * const error = createValidationError('ValidationError', 'INVALID_FORMAT', 'Invalid email format')
 * ```
 */
export const createValidationError = createErrorFactory('validation', 'medium')

/**
 * Pre-configured error factory for configuration errors.
 * @example
 * ```typescript
 * const error = createConfigError('ConfigError', 'MISSING_REQUIRED', 'API key not configured')
 * ```
 */
export const createConfigError = createErrorFactory('config', 'medium')

/**
 * Pre-configured error factory for git operations.
 * @example
 * ```typescript
 * const error = createGitError('GitError', 'UNCOMMITTED_CHANGES', 'Working directory not clean')
 * ```
 */
export const createGitError = createErrorFactory('git', 'medium')

/**
 * Pre-configured error factory for CLI-related errors.
 * @example
 * ```typescript
 * const error = createCliError('ArgumentError', 'MISSING_REQUIRED_ARG', 'Required argument --file not provided')
 * ```
 */
export const createCliError = createErrorFactory('cli', 'medium')

/**
 * Map Node.js errors to CoreError format.
 * Handles common Node.js error patterns like ENOENT, EACCES, etc.
 *
 * @param component - Component where error occurred
 * @param operation - Operation being performed
 * @param path - File/resource path involved
 * @param error - The Node.js error
 * @returns Standardized CoreError
 *
 * @example
 * ```typescript
 * try {
 *   await fs.readFile(path)
 * } catch (error) {
 *   return err(mapNodeError('config-loader', 'readConfig', path, error))
 * }
 * ```
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

/**
 * Map third-party library errors to CoreError format.
 * Use this when wrapping external library calls.
 *
 * @param component - Component using the library
 * @param library - Library name (e.g., 'axios', 'prisma')
 * @param operation - Operation being performed
 * @param error - The library error
 * @returns Standardized CoreError
 *
 * @example
 * ```typescript
 * try {
 *   await axios.get(url)
 * } catch (error) {
 *   return err(mapLibraryError('api-client', 'axios', 'fetchData', error))
 * }
 * ```
 */
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

/**
 * Map validation errors to CoreError format.
 * Provides consistent validation error structure.
 *
 * @param component - Component performing validation
 * @param field - Field being validated
 * @param value - Value that failed validation
 * @param error - The validation error
 * @returns Standardized CoreError
 *
 * @example
 * ```typescript
 * const result = validateEmail(email)
 * if (result.isErr()) {
 *   return err(mapValidationError('user-service', 'email', email, result.error))
 * }
 * ```
 */
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
