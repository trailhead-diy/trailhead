/**
 * @module errors
 * @description Standardized error factories for data operations
 *
 * Provides type-safe error creation with consistent structure and metadata
 * for all data processing operations (CSV, JSON, Excel, format detection).
 */

import {
  createErrorFactory,
  mapNodeError as coreMapNodeError,
  mapLibraryError as coreMapLibraryError,
  mapValidationError as coreMapValidationError,
  type CoreError,
} from '@esteban-url/core'
import type { FileSystemError } from '@esteban-url/fs'

// ========================================
// Standardized Error Factory
// ========================================

/**
 * Base error factory for all data-related errors
 * @private
 */
const createDataError = createErrorFactory('data', 'medium')

// ========================================
// Specialized Error Factories
// ========================================

/**
 * Create a CSV-specific error with appropriate context
 * @param {string} message - Error message describing the issue
 * @param {Object} [options] - Additional error options
 * @param {string} [options.details] - Detailed error information
 * @param {unknown} [options.cause] - Original error that caused this error
 * @param {Record<string, unknown>} [options.context] - Additional context data
 * @returns {CoreError} Standardized CSV error object
 *
 * @example
 * ```typescript
 * throw createCSVError('Invalid delimiter in CSV file', {
 *   details: 'Expected comma but found semicolon',
 *   context: { line: 5, column: 3 }
 * })
 * ```
 */
export const createCSVError = (
  message: string,
  options?: {
    details?: string
    cause?: unknown
    context?: Record<string, unknown>
  }
): CoreError =>
  createDataError('CSVError', 'CSV_ERROR', message, {
    operation: 'csv',
    suggestion: 'Verify CSV format, delimiter, and encoding',
    ...options,
  })

/**
 * Create a JSON-specific error with appropriate context
 * @param {string} message - Error message describing the issue
 * @param {Object} [options] - Additional error options
 * @param {string} [options.details] - Detailed error information
 * @param {unknown} [options.cause] - Original error that caused this error
 * @param {Record<string, unknown>} [options.context] - Additional context data
 * @returns {CoreError} Standardized JSON error object
 *
 * @example
 * ```typescript
 * throw createJSONError('Invalid JSON syntax', {
 *   details: 'Unexpected token at position 42',
 *   context: { position: 42, char: '}' }
 * })
 * ```
 */
export const createJSONError = (
  message: string,
  options?: {
    details?: string
    cause?: unknown
    context?: Record<string, unknown>
  }
): CoreError =>
  createDataError('JSONError', 'JSON_ERROR', message, {
    operation: 'json',
    suggestion: 'Check JSON syntax and structure',
    ...options,
  })

/**
 * Create an Excel-specific error with appropriate context
 * @param {string} message - Error message describing the issue
 * @param {Object} [options] - Additional error options
 * @param {string} [options.details] - Detailed error information
 * @param {unknown} [options.cause] - Original error that caused this error
 * @param {Record<string, unknown>} [options.context] - Additional context data
 * @returns {CoreError} Standardized Excel error object
 *
 * @example
 * ```typescript
 * throw createExcelError('Worksheet not found', {
 *   details: 'Sheet "Summary" does not exist',
 *   context: { requestedSheet: 'Summary', availableSheets: ['Sheet1', 'Sheet2'] }
 * })
 * ```
 */
export const createExcelError = (
  message: string,
  options?: {
    details?: string
    cause?: unknown
    context?: Record<string, unknown>
  }
): CoreError =>
  createDataError('ExcelError', 'EXCEL_ERROR', message, {
    operation: 'excel',
    suggestion: 'Verify Excel file format and worksheet configuration',
    ...options,
  })

/**
 * Create a parsing error for any format parsing failure
 * @param {string} message - Error message describing the issue
 * @param {Object} [options] - Additional error options
 * @param {string} [options.details] - Detailed error information
 * @param {unknown} [options.cause] - Original error that caused this error
 * @param {Record<string, unknown>} [options.context] - Additional context data
 * @returns {CoreError} Standardized parsing error object
 *
 * @example
 * ```typescript
 * throw createParsingError('Failed to parse data', {
 *   details: 'Unexpected data structure',
 *   context: { format: 'csv', line: 10 }
 * })
 * ```
 */
export const createParsingError = (
  message: string,
  options?: {
    details?: string
    cause?: unknown
    context?: Record<string, unknown>
  }
): CoreError =>
  createDataError('ParsingError', 'PARSING_ERROR', message, {
    operation: 'parse',
    severity: 'high',
    recoverable: false,
    suggestion: 'Review data format and parsing configuration',
    ...options,
  })

/**
 * Create a validation error for data validation failures
 * @param {string} message - Error message describing the issue
 * @param {Object} [options] - Additional error options
 * @param {string} [options.details] - Detailed error information
 * @param {unknown} [options.cause] - Original error that caused this error
 * @param {Record<string, unknown>} [options.context] - Additional context data
 * @returns {CoreError} Standardized validation error object
 *
 * @example
 * ```typescript
 * throw createValidationError('Data validation failed', {
 *   details: 'Required field "email" is missing',
 *   context: { field: 'email', row: 5 }
 * })
 * ```
 */
export const createValidationError = (
  message: string,
  options?: {
    details?: string
    cause?: unknown
    context?: Record<string, unknown>
  }
): CoreError =>
  createDataError('ValidationError', 'VALIDATION_ERROR', message, {
    operation: 'validate',
    suggestion: 'Check data integrity and validation rules',
    ...options,
  })

/**
 * Create a format detection error when format cannot be determined
 * @param {string} message - Error message describing the issue
 * @param {Object} [options] - Additional error options
 * @param {string} [options.details] - Detailed error information
 * @param {unknown} [options.cause] - Original error that caused this error
 * @param {Record<string, unknown>} [options.context] - Additional context data
 * @returns {CoreError} Standardized format detection error object
 *
 * @example
 * ```typescript
 * throw createFormatDetectionError('Cannot detect file format', {
 *   details: 'File has no extension and content is ambiguous',
 *   context: { fileName: 'data', contentSample: '...' }
 * })
 * ```
 */
export const createFormatDetectionError = (
  message: string,
  options?: {
    details?: string
    cause?: unknown
    context?: Record<string, unknown>
  }
): CoreError =>
  createDataError('FormatDetectionError', 'FORMAT_DETECTION_ERROR', message, {
    operation: 'detect',
    severity: 'low',
    suggestion: 'Specify format explicitly or check file content',
    ...options,
  })

/**
 * Create a conversion error for format conversion failures
 * @param {string} message - Error message describing the issue
 * @param {Object} [options] - Additional error options
 * @param {string} [options.details] - Detailed error information
 * @param {unknown} [options.cause] - Original error that caused this error
 * @param {Record<string, unknown>} [options.context] - Additional context data
 * @returns {CoreError} Standardized conversion error object
 *
 * @example
 * ```typescript
 * throw createConversionError('Cannot convert Excel to CSV', {
 *   details: 'Multiple worksheets found, specify which to convert',
 *   context: { sourceFormat: 'excel', targetFormat: 'csv', sheets: ['Sheet1', 'Sheet2'] }
 * })
 * ```
 */
export const createConversionError = (
  message: string,
  options?: {
    details?: string
    cause?: unknown
    context?: Record<string, unknown>
  }
): CoreError =>
  createDataError('ConversionError', 'CONVERSION_ERROR', message, {
    operation: 'convert',
    suggestion: 'Verify source and target format compatibility',
    ...options,
  })

// ========================================
// Error Mapping Utilities (using core implementations)
// ========================================

/**
 * Map Node.js errors to standardized CoreError format
 * @param {string} operation - Operation that caused the error (e.g., 'readFile', 'writeFile')
 * @param {string} path - File path related to the error
 * @param {unknown} error - Original Node.js error
 * @returns {CoreError} Standardized error object
 *
 * @example
 * ```typescript
 * try {
 *   await fs.readFile(path)
 * } catch (error) {
 *   throw mapNodeError('readFile', path, error)
 * }
 * ```
 */
export const mapNodeError = (operation: string, path: string, error: unknown): CoreError =>
  coreMapNodeError('data', operation, path, error)

/**
 * Map third-party library errors to standardized CoreError format
 * @param {string} library - Library name (e.g., 'papaparse', 'xlsx')
 * @param {string} operation - Operation that caused the error
 * @param {unknown} error - Original library error
 * @returns {CoreError} Standardized error object
 *
 * @example
 * ```typescript
 * try {
 *   Papa.parse(csvContent)
 * } catch (error) {
 *   throw mapLibraryError('papaparse', 'parse', error)
 * }
 * ```
 */
export const mapLibraryError = (library: string, operation: string, error: unknown): CoreError =>
  coreMapLibraryError('data', library, operation, error)

/**
 * Map validation errors to standardized CoreError format
 * @param {string} field - Field that failed validation
 * @param {unknown} value - Value that failed validation
 * @param {unknown} error - Original validation error
 * @returns {CoreError} Standardized error object
 *
 * @example
 * ```typescript
 * if (!isValidEmail(email)) {
 *   throw mapValidationError('email', email, 'Invalid email format')
 * }
 * ```
 */
export const mapValidationError = (field: string, value: unknown, error: unknown): CoreError =>
  coreMapValidationError('data', field, value, error)

/**
 * Map FileSystem errors to standardized CoreError format
 * @param {FileSystemError} fsError - FileSystem error object
 * @param {string} operation - Operation that caused the error
 * @returns {CoreError} Standardized error object
 *
 * @example
 * ```typescript
 * const result = await fs.readFile(path)
 * if (result.isErr()) {
 *   throw mapFileSystemError(result.error, 'readDataFile')
 * }
 * ```
 */
export const mapFileSystemError = (fsError: FileSystemError, operation: string): CoreError => {
  return createDataError('FileSystemError', 'FS_ERROR', fsError.message, {
    operation,
    severity: 'high',
    details: fsError.details,
    cause: fsError.cause,
    context: { ...fsError.context, operation },
    recoverable: fsError.recoverable,
    suggestion: fsError.suggestion || 'Check file path and permissions',
  })
}

/**
 * Base error factory for creating custom data errors
 * @see createErrorFactory from @esteban-url/core
 */
export { createDataError }
