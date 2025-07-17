import {
  createErrorFactory,
  mapNodeError as coreMapNodeError,
  mapLibraryError as coreMapLibraryError,
  mapValidationError as coreMapValidationError,
} from '@esteban-url/core'
import type { CoreError } from '@esteban-url/core'
import type { FileSystemError } from '@esteban-url/fs'

// ========================================
// Standardized Error Factory
// ========================================

const createDataError = createErrorFactory('data', 'medium')

// ========================================
// Specialized Error Factories
// ========================================

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

export const mapNodeError = (operation: string, path: string, error: unknown): CoreError =>
  coreMapNodeError('data', operation, path, error)

export const mapLibraryError = (library: string, operation: string, error: unknown): CoreError =>
  coreMapLibraryError('data', library, operation, error)

export const mapValidationError = (field: string, value: unknown, error: unknown): CoreError =>
  coreMapValidationError('data', field, value, error)

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

// Export the factory for use in operations
export { createDataError }
