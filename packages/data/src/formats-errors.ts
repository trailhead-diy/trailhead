/**
 * @module formats-errors
 * @description Error factory functions for format detection, MIME handling, and conversion
 *
 * Provides standardized error creation with consistent structure for all
 * format-related operations including detection, MIME type handling, and conversion.
 */

import { createCoreError, type CoreError } from '@trailhead/core'

// ========================================
// Error Factory Functions
// ========================================

/**
 * Creates a general format error for format-related failures
 *
 * @param message - Error message describing the issue
 * @param options - Additional error context
 * @param options.details - Detailed error information
 * @param options.cause - Original error that caused this error
 * @param options.context - Additional context data
 * @returns CoreError with format domain
 */
export const createFormatError = (
  message: string,
  options: {
    details?: string
    cause?: unknown
    context?: Record<string, unknown>
  } = {}
): CoreError =>
  createCoreError('FormatError', 'FORMAT_ERROR', message, {
    details: options.details,
    cause: options.cause,
    context: options.context,
    recoverable: true,
    suggestion: 'Check file format and detection options',
  })

/**
 * Creates a detection error for format detection failures
 *
 * @param message - Error message describing the detection issue
 * @param options - Additional error context
 * @param options.details - Detailed error information
 * @param options.cause - Original error that caused this error
 * @param options.context - Additional context data
 * @returns CoreError with detection domain
 */
export const createDetectionError = (
  message: string,
  options: {
    details?: string
    cause?: unknown
    context?: Record<string, unknown>
  } = {}
): CoreError =>
  createCoreError('DetectionError', 'DETECTION_ERROR', message, {
    details: options.details,
    cause: options.cause,
    context: options.context,
    recoverable: true,
    suggestion: 'Verify file content and detection configuration',
  })

/**
 * Creates a MIME error for MIME type operation failures
 *
 * @param message - Error message describing the MIME issue
 * @param options - Additional error context
 * @param options.details - Detailed error information
 * @param options.cause - Original error that caused this error
 * @param options.context - Additional context data
 * @returns CoreError with MIME domain
 */
export const createMimeError = (
  message: string,
  options: {
    details?: string
    cause?: unknown
    context?: Record<string, unknown>
  } = {}
): CoreError =>
  createCoreError('MimeError', 'MIME_ERROR', message, {
    details: options.details,
    cause: options.cause,
    context: options.context,
    recoverable: true,
    suggestion: 'Check MIME type format and configuration',
  })

/**
 * Creates a conversion error for format conversion failures
 *
 * @param message - Error message describing the conversion issue
 * @param options - Additional error context
 * @param options.details - Detailed error information
 * @param options.cause - Original error that caused this error
 * @param options.context - Additional context data
 * @returns CoreError with conversion domain
 */
export const createConversionError = (
  message: string,
  options: {
    details?: string
    cause?: unknown
    context?: Record<string, unknown>
  } = {}
): CoreError =>
  createCoreError('ConversionError', 'CONVERSION_ERROR', message, {
    details: options.details,
    cause: options.cause,
    context: options.context,
    recoverable: true,
    suggestion: 'Verify format conversion support and options',
  })

/**
 * Creates an error for unsupported file formats
 *
 * @param format - The unsupported format identifier
 * @param options - Additional error context
 * @param options.details - Detailed error information
 * @returns CoreError indicating format is not supported
 */
export const createUnsupportedFormatError = (
  format: string,
  options: { details?: string } = {}
): CoreError =>
  createFormatError(`Unsupported format: ${format}`, {
    details: options.details || `Format: ${format}`,
    context: { format, details: options.details },
  })

/**
 * Creates an error for invalid or empty buffer input
 *
 * @param message - Custom error message (default: 'Invalid or empty buffer provided')
 * @returns CoreError indicating buffer is invalid
 */
export const createInvalidBufferError = (
  message: string = 'Invalid or empty buffer provided'
): CoreError =>
  createDetectionError(message, {
    details: 'Buffer must contain valid file data for format detection',
    context: { bufferLength: 0 },
  })

/**
 * Creates an error for invalid MIME type format
 *
 * @param mimeType - The invalid MIME type string
 * @returns CoreError indicating MIME type is invalid
 */
export const createInvalidMimeTypeError = (mimeType: string): CoreError =>
  createMimeError('Invalid MIME type format', {
    details: `MIME type "${mimeType}" does not follow standard format`,
    context: { mimeType, expected: 'type/subtype' },
  })

// ========================================
// Error Mapping Utilities
// ========================================

/**
 * Maps file system errors to CoreError format
 *
 * @param operation - Operation that caused the error (e.g., 'read', 'write')
 * @param path - File path that was being accessed
 * @param error - Original error object
 * @returns CoreError with file operation context
 */
export const mapFileError = (operation: string, path: string, error: unknown): CoreError => {
  const errorMessage = error instanceof Error ? error.message : String(error)

  return createFormatError(`File ${operation} failed`, {
    details: `Operation: ${operation}, Path: ${path}, Error: ${errorMessage}`,
    cause: error,
    context: { operation, path },
  })
}

/**
 * Maps third-party library errors to CoreError format
 *
 * @param library - Library name (e.g., 'file-type', 'mime-types')
 * @param operation - Operation that caused the error
 * @param error - Original error object
 * @returns CoreError with library context
 */
export const mapLibraryError = (library: string, operation: string, error: unknown): CoreError => {
  const errorMessage = error instanceof Error ? error.message : String(error)

  return createFormatError(`${library} operation failed`, {
    details: `Library: ${library}, Operation: ${operation}, Error: ${errorMessage}`,
    cause: error,
    context: { library, operation },
  })
}

/**
 * Maps detection errors to CoreError format with source context
 *
 * @param source - Detection source (e.g., 'magic-numbers', 'extension')
 * @param input - Input that caused the error (truncated for safety)
 * @param error - Original error object
 * @returns CoreError with detection context
 */
export const mapDetectionError = (source: string, input: string, error: unknown): CoreError => {
  const errorMessage = error instanceof Error ? error.message : String(error)

  return createDetectionError(`Format detection failed from ${source}`, {
    details: `Source: ${source}, Input: ${input}, Error: ${errorMessage}`,
    cause: error,
    context: { source, input: input.substring(0, 100) },
  })
}
