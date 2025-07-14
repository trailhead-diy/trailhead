/**
 * Error factory utilities for testing
 *
 * Helper functions for creating consistent error objects in tests.
 * Provides type-safe error creation with strict error codes and comprehensive utilities.
 *
 * @example
 * ```typescript
 * import { createValidationError, createTestError, hasErrorCode } from '@esteban-url/core/testing'
 *
 * // Create specific error types
 * const validationErr = createValidationError('Required field missing', 'email')
 * const fsErr = createFsError('read', '/path/to/file')
 *
 * // Create custom errors
 * const customErr = createTestError('CUSTOM_ERROR', 'Something went wrong')
 *
 * // Type-safe error checking
 * if (hasErrorCode(error, 'VALIDATION_ERROR')) {
 *   // TypeScript knows error.code is 'VALIDATION_ERROR'
 * }
 * ```
 */

import { err, type Result } from '../errors/index.js'

/**
 * Standard error codes for testing
 */
export type TestErrorCode =
  | 'VALIDATION_ERROR'
  | 'FS_ERROR'
  | 'NETWORK_ERROR'
  | 'CONFIG_ERROR'
  | 'PARSE_ERROR'
  | 'TIMEOUT_ERROR'
  | 'ACCESS_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'CHAINED_ERROR'
  | 'MOCK_ERROR'
  | 'CUSTOM_ERROR'

/**
 * Standard error types for testing
 */
export interface TestError {
  code: TestErrorCode
  message: string
  cause?: unknown
}

/**
 * Creates a generic test error
 *
 * @param code - Error code from TestErrorCode union
 * @param message - Human-readable error message
 * @param cause - Optional underlying cause
 * @returns TestError with specified code and message
 *
 * @example
 * ```typescript
 * const error = createTestError('CUSTOM_ERROR', 'Operation failed', originalError)
 * expect(error.code).toBe('CUSTOM_ERROR')
 * expect(error.message).toBe('Operation failed')
 * ```
 */
export const createTestError = (
  code: TestErrorCode,
  message: string,
  cause?: unknown
): TestError => ({
  code,
  message,
  cause,
})

/**
 * Creates a validation error for testing
 *
 * @param message - Validation error message
 * @param field - Optional field name that failed validation
 * @returns ValidationError with VALIDATION_ERROR code
 *
 * @example
 * ```typescript
 * // Field-specific validation error
 * const fieldError = createValidationError('is required', 'email')
 * // Result: { code: 'VALIDATION_ERROR', message: 'email: is required' }
 *
 * // General validation error
 * const generalError = createValidationError('Invalid input format')
 * // Result: { code: 'VALIDATION_ERROR', message: 'Invalid input format' }
 * ```
 */
export const createValidationError = (
  message: string,
  field?: string
): TestError & { code: 'VALIDATION_ERROR' } => ({
  code: 'VALIDATION_ERROR',
  message: field ? `${field}: ${message}` : message,
})

/**
 * Creates a filesystem error for testing
 *
 * @param operation - The filesystem operation that failed
 * @param path - The file/directory path involved
 * @param cause - Optional underlying error cause
 * @returns FilesystemError with FS_ERROR code
 *
 * @example
 * ```typescript
 * const readError = createFsError('read', '/etc/config.json')
 * // Result: { code: 'FS_ERROR', message: 'Failed to read /etc/config.json' }
 *
 * const writeError = createFsError('write', '/tmp/output.txt', originalError)
 * // Includes cause for debugging
 * ```
 */
export const createFsError = (
  operation: string,
  path: string,
  cause?: unknown
): TestError & { code: 'FS_ERROR' } => ({
  code: 'FS_ERROR',
  message: `Failed to ${operation} ${path}`,
  cause,
})

/**
 * Creates a network error for testing
 *
 * @param message - Network error description
 * @param status - Optional HTTP status code
 * @returns NetworkError with NETWORK_ERROR code
 *
 * @example
 * ```typescript
 * const timeoutError = createNetworkError('Request timeout')
 * const httpError = createNetworkError('Not Found', 404)
 * // Result: { code: 'NETWORK_ERROR', message: 'Not Found (404)', cause: { status: 404 } }
 * ```
 */
export const createNetworkError = (
  message: string,
  status?: number
): TestError & { code: 'NETWORK_ERROR' } => ({
  code: 'NETWORK_ERROR',
  message: status ? `${message} (${status})` : message,
  cause: status ? { status } : undefined,
})

/**
 * Creates a configuration error for testing
 *
 * @param message - Configuration error description
 * @param key - Optional configuration key that caused the error
 * @returns ConfigError with CONFIG_ERROR code
 *
 * @example
 * ```typescript
 * const keyError = createConfigError('invalid value', 'database.port')
 * // Result: { code: 'CONFIG_ERROR', message: 'Configuration error for "database.port": invalid value' }
 *
 * const generalError = createConfigError('Configuration file not found')
 * ```
 */
export const createConfigError = (
  message: string,
  key?: string
): TestError & { code: 'CONFIG_ERROR' } => ({
  code: 'CONFIG_ERROR',
  message: key ? `Configuration error for "${key}": ${message}` : message,
})

/**
 * Creates a parsing error for testing
 *
 * @param message - Parse error description
 * @param position - Optional character/line position where parsing failed
 * @returns ParseError with PARSE_ERROR code
 *
 * @example
 * ```typescript
 * const syntaxError = createParseError('unexpected token', 42)
 * // Result: { code: 'PARSE_ERROR', message: 'Parse error at position 42: unexpected token' }
 *
 * const formatError = createParseError('Invalid JSON format')
 * ```
 */
export const createParseError = (
  message: string,
  position?: number
): TestError & { code: 'PARSE_ERROR' } => ({
  code: 'PARSE_ERROR',
  message: position ? `Parse error at position ${position}: ${message}` : message,
})

/**
 * Creates a timeout error for testing
 *
 * @param operation - The operation that timed out
 * @param timeout - Timeout duration in milliseconds
 * @returns TimeoutError with TIMEOUT_ERROR code
 *
 * @example
 * ```typescript
 * const dbTimeout = createTimeoutError('database query', 5000)
 * // Result: { code: 'TIMEOUT_ERROR', message: 'Operation "database query" timed out after 5000ms' }
 * ```
 */
export const createTimeoutError = (
  operation: string,
  timeout: number
): TestError & { code: 'TIMEOUT_ERROR' } => ({
  code: 'TIMEOUT_ERROR',
  message: `Operation "${operation}" timed out after ${timeout}ms`,
})

/**
 * Creates an access error for testing
 *
 * @param resource - The resource that couldn't be accessed
 * @param action - The action that was denied
 * @returns AccessError with ACCESS_ERROR code
 *
 * @example
 * ```typescript
 * const permissionError = createAccessError('secret.txt', 'read')
 * // Result: { code: 'ACCESS_ERROR', message: 'Access denied: cannot read secret.txt' }
 * ```
 */
export const createAccessError = (
  resource: string,
  action: string
): TestError & { code: 'ACCESS_ERROR' } => ({
  code: 'ACCESS_ERROR',
  message: `Access denied: cannot ${action} ${resource}`,
})

/**
 * Creates a not found error for testing
 *
 * @param resource - The type of resource that wasn't found
 * @param identifier - The identifier that couldn't be located
 * @returns NotFoundError with NOT_FOUND code
 *
 * @example
 * ```typescript
 * const userError = createNotFoundError('User', 'john@example.com')
 * // Result: { code: 'NOT_FOUND', message: 'User not found: john@example.com' }
 *
 * const fileError = createNotFoundError('File', '/path/to/missing.txt')
 * ```
 */
export const createNotFoundError = (
  resource: string,
  identifier: string
): TestError & { code: 'NOT_FOUND' } => ({
  code: 'NOT_FOUND',
  message: `${resource} not found: ${identifier}`,
})

/**
 * Creates a conflict error for testing
 *
 * @param resource - The type of resource that conflicts
 * @param identifier - The identifier that already exists
 * @returns ConflictError with CONFLICT code
 *
 * @example
 * ```typescript
 * const userConflict = createConflictError('User', 'john@example.com')
 * // Result: { code: 'CONFLICT', message: 'User already exists: john@example.com' }
 *
 * const fileConflict = createConflictError('File', 'output.txt')
 * ```
 */
export const createConflictError = (
  resource: string,
  identifier: string
): TestError & { code: 'CONFLICT' } => ({
  code: 'CONFLICT',
  message: `${resource} already exists: ${identifier}`,
})

/**
 * Creates an Error Result from a TestError
 */
export const createErrorResult = <T>(error: TestError): Result<T, TestError> => err(error)

/**
 * Creates a validation Error Result
 */
export const createValidationErrorResult = <T>(
  message: string,
  field?: string
): Result<T, TestError> => err(createValidationError(message, field))

/**
 * Creates a filesystem Error Result
 */
export const createFsErrorResult = <T>(
  operation: string,
  path: string,
  cause?: unknown
): Result<T, TestError> => err(createFsError(operation, path, cause))

/**
 * Error factory builder for custom error types
 */
export const createErrorFactory =
  <T extends Record<string, unknown>>(code: TestErrorCode, createMessage: (params: T) => string) =>
  (params: T): TestError => ({
    code,
    message: createMessage(params),
    cause: params,
  })

/**
 * Creates a mock error for testing error handling
 */
export const createMockError = (message = 'Mock error'): TestError => ({
  code: 'MOCK_ERROR',
  message,
})

/**
 * Creates a mock async error for testing
 */
export const createMockAsyncError = (message = 'Mock async error'): Promise<never> => {
  return Promise.reject(createMockError(message))
}

/**
 * Creates an error chain for testing error propagation
 */
export const createErrorChain = (errors: string[]): TestError & { code: 'CHAINED_ERROR' } => {
  const [primary, ...causes] = errors
  return {
    code: 'CHAINED_ERROR',
    message: primary,
    cause: causes.length > 0 ? createErrorChain(causes) : undefined,
  }
}

/**
 * Extracts error messages from a chain
 */
export const extractErrorChain = (error: TestError & { code: 'CHAINED_ERROR' }): string[] => {
  const messages = [error.message]
  if (error.cause && isTestError(error.cause) && hasErrorCode(error.cause, 'CHAINED_ERROR')) {
    messages.push(...extractErrorChain(error.cause))
  }
  return messages
}

/**
 * Type guard to check if an error is a TestError
 */
export const isTestError = (error: unknown): error is TestError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof (error as TestError).code === 'string' &&
    typeof (error as TestError).message === 'string'
  )
}

/**
 * Type guard to check if an error has a specific code
 */
export const hasErrorCode = <T extends TestErrorCode>(
  error: TestError,
  code: T
): error is TestError & { code: T } => {
  return error.code === code
}
