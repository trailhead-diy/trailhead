import { createCoreError } from '@esteban-url/core'
import type { CoreError } from '@esteban-url/core'
import type { FileSystemError } from '@esteban-url/fs'

// ========================================
// Error Factory Functions
// ========================================

export const createDataError = (
  message: string,
  details?: string,
  cause?: unknown,
  context?: Record<string, unknown>
): CoreError =>
  createCoreError('DataError', 'DATA_ERROR', message, {
    component: 'data',
    operation: 'process',
    severity: 'medium',
    details,
    cause,
    context,
    recoverable: true,
    suggestion: 'Check data format and processing options',
  })

export const createCSVError = (
  message: string,
  details?: string,
  cause?: unknown,
  context?: Record<string, unknown>
): CoreError =>
  createCoreError('CSVError', 'CSV_ERROR', message, {
    component: 'data',
    operation: 'csv',
    severity: 'medium',
    details,
    cause,
    context,
    recoverable: true,
    suggestion: 'Verify CSV format, delimiter, and encoding',
  })

export const createJSONError = (
  message: string,
  details?: string,
  cause?: unknown,
  context?: Record<string, unknown>
): CoreError =>
  createCoreError('JSONError', 'JSON_ERROR', message, {
    component: 'data',
    operation: 'json',
    severity: 'medium',
    details,
    cause,
    context,
    recoverable: true,
    suggestion: 'Check JSON syntax and structure',
  })

export const createExcelError = (
  message: string,
  details?: string,
  cause?: unknown,
  context?: Record<string, unknown>
): CoreError =>
  createCoreError('ExcelError', 'EXCEL_ERROR', message, {
    component: 'data',
    operation: 'excel',
    severity: 'medium',
    details,
    cause,
    context,
    recoverable: true,
    suggestion: 'Verify Excel file format and worksheet configuration',
  })

export const createParsingError = (
  message: string,
  details?: string,
  cause?: unknown,
  context?: Record<string, unknown>
): CoreError =>
  createCoreError('ParsingError', 'PARSING_ERROR', message, {
    component: 'data',
    operation: 'parse',
    severity: 'high',
    details,
    cause,
    context,
    recoverable: false,
    suggestion: 'Review data format and parsing configuration',
  })

export const createValidationError = (
  message: string,
  details?: string,
  cause?: unknown,
  context?: Record<string, unknown>
): CoreError =>
  createCoreError('ValidationError', 'VALIDATION_ERROR', message, {
    component: 'data',
    operation: 'validate',
    severity: 'medium',
    details,
    cause,
    context,
    recoverable: true,
    suggestion: 'Check data integrity and validation rules',
  })

export const createFormatDetectionError = (
  message: string,
  details?: string,
  cause?: unknown,
  context?: Record<string, unknown>
): CoreError =>
  createCoreError('FormatDetectionError', 'FORMAT_DETECTION_ERROR', message, {
    component: 'data',
    operation: 'detect',
    severity: 'low',
    details,
    cause,
    context,
    recoverable: true,
    suggestion: 'Specify format explicitly or check file content',
  })

export const createConversionError = (
  message: string,
  details?: string,
  cause?: unknown,
  context?: Record<string, unknown>
): CoreError =>
  createCoreError('ConversionError', 'CONVERSION_ERROR', message, {
    component: 'data',
    operation: 'convert',
    severity: 'medium',
    details,
    cause,
    context,
    recoverable: true,
    suggestion: 'Verify source and target format compatibility',
  })

// ========================================
// Error Mapping Utilities
// ========================================

export const mapNodeError = (operation: string, path: string, error: unknown): CoreError => {
  const errorMessage = error instanceof Error ? error.message : String(error)

  return createDataError(
    `${operation} failed`,
    `Operation: ${operation}, Path: ${path}, Error: ${errorMessage}`,
    error,
    { operation, path }
  )
}

export const mapLibraryError = (library: string, operation: string, error: unknown): CoreError => {
  const errorMessage = error instanceof Error ? error.message : String(error)

  return createDataError(
    `${library} operation failed`,
    `Library: ${library}, Operation: ${operation}, Error: ${errorMessage}`,
    error,
    { library, operation }
  )
}

export const mapValidationError = (field: string, value: unknown, error: unknown): CoreError => {
  const errorMessage = error instanceof Error ? error.message : String(error)

  return createValidationError(
    `Validation failed for field: ${field}`,
    `Field: ${field}, Value: ${JSON.stringify(value)}, Error: ${errorMessage}`,
    error,
    { field, value }
  )
}

export const mapFileSystemError = (fsError: FileSystemError, operation: string): CoreError => {
  return createCoreError('FileSystemError', 'FS_ERROR', fsError.message, {
    component: 'data',
    operation,
    severity: 'high',
    details: fsError.details,
    cause: fsError.cause,
    context: { ...fsError.context, operation },
    recoverable: fsError.recoverable,
    suggestion: fsError.suggestion || 'Check file path and permissions',
  })
}
