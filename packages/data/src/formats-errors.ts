import { createCoreError, type CoreError } from '@esteban-url/core'

// ========================================
// Error Factory Functions
// ========================================

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

export const createUnsupportedFormatError = (
  format: string,
  options: { details?: string } = {}
): CoreError =>
  createFormatError(`Unsupported format: ${format}`, {
    details: options.details || `Format: ${format}`,
    context: { format, details: options.details },
  })

export const createInvalidBufferError = (
  message: string = 'Invalid or empty buffer provided'
): CoreError =>
  createDetectionError(message, {
    details: 'Buffer must contain valid file data for format detection',
    context: { bufferLength: 0 },
  })

export const createInvalidMimeTypeError = (mimeType: string): CoreError =>
  createMimeError('Invalid MIME type format', {
    details: `MIME type "${mimeType}" does not follow standard format`,
    context: { mimeType, expected: 'type/subtype' },
  })

// ========================================
// Error Mapping Utilities
// ========================================

export const mapFileError = (operation: string, path: string, error: unknown): CoreError => {
  const errorMessage = error instanceof Error ? error.message : String(error)

  return createFormatError(`File ${operation} failed`, {
    details: `Operation: ${operation}, Path: ${path}, Error: ${errorMessage}`,
    cause: error,
    context: { operation, path },
  })
}

export const mapLibraryError = (library: string, operation: string, error: unknown): CoreError => {
  const errorMessage = error instanceof Error ? error.message : String(error)

  return createFormatError(`${library} operation failed`, {
    details: `Library: ${library}, Operation: ${operation}, Error: ${errorMessage}`,
    cause: error,
    context: { library, operation },
  })
}

export const mapDetectionError = (source: string, input: string, error: unknown): CoreError => {
  const errorMessage = error instanceof Error ? error.message : String(error)

  return createDetectionError(`Format detection failed from ${source}`, {
    details: `Source: ${source}, Input: ${input}, Error: ${errorMessage}`,
    cause: error,
    context: { source, input: input.substring(0, 100) },
  })
}
