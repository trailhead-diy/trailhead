import { createCoreError } from '@esteban-url/core'
import type { CoreError } from '@esteban-url/core'

// ========================================
// Error Factory Functions
// ========================================

export const createFormatError = (
  message: string,
  details?: string,
  cause?: unknown,
  context?: Record<string, unknown>
): CoreError =>
  createCoreError('FormatError', message, {
    details,
    cause,
    context,
    recoverable: true,
    suggestion: 'Check file format and detection options',
  })

export const createDetectionError = (
  message: string,
  details?: string,
  cause?: unknown,
  context?: Record<string, unknown>
): CoreError =>
  createCoreError('DetectionError', message, {
    details,
    cause,
    context,
    recoverable: true,
    suggestion: 'Verify file content and detection configuration',
  })

export const createMimeError = (
  message: string,
  details?: string,
  cause?: unknown,
  context?: Record<string, unknown>
): CoreError =>
  createCoreError('MimeError', message, {
    details,
    cause,
    context,
    recoverable: true,
    suggestion: 'Check MIME type format and configuration',
  })

export const createConversionError = (
  message: string,
  details?: string,
  cause?: unknown,
  context?: Record<string, unknown>
): CoreError =>
  createCoreError('ConversionError', message, {
    details,
    cause,
    context,
    recoverable: true,
    suggestion: 'Verify format conversion support and options',
  })

export const createUnsupportedFormatError = (format: string, operation: string): CoreError =>
  createFormatError(
    `Unsupported format for ${operation}`,
    `Format: ${format}, Operation: ${operation}`,
    undefined,
    { format, operation }
  )

export const createInvalidBufferError = (
  message: string = 'Invalid or empty buffer provided'
): CoreError =>
  createDetectionError(
    message,
    'Buffer must contain valid file data for format detection',
    undefined,
    { bufferLength: 0 }
  )

export const createInvalidMimeTypeError = (mimeType: string): CoreError =>
  createMimeError(
    'Invalid MIME type format',
    `MIME type "${mimeType}" does not follow standard format`,
    undefined,
    { mimeType, expected: 'type/subtype' }
  )

// ========================================
// Error Mapping Utilities
// ========================================

export const mapFileError = (operation: string, path: string, error: unknown): CoreError => {
  const errorMessage = error instanceof Error ? error.message : String(error)

  return createFormatError(
    `File ${operation} failed`,
    `Operation: ${operation}, Path: ${path}, Error: ${errorMessage}`,
    error,
    { operation, path }
  )
}

export const mapLibraryError = (library: string, operation: string, error: unknown): CoreError => {
  const errorMessage = error instanceof Error ? error.message : String(error)

  return createFormatError(
    `${library} operation failed`,
    `Library: ${library}, Operation: ${operation}, Error: ${errorMessage}`,
    error,
    { library, operation }
  )
}

export const mapDetectionError = (source: string, input: string, error: unknown): CoreError => {
  const errorMessage = error instanceof Error ? error.message : String(error)

  return createDetectionError(
    `Format detection failed from ${source}`,
    `Source: ${source}, Input: ${input}, Error: ${errorMessage}`,
    error,
    { source, input: input.substring(0, 100) }
  )
}
