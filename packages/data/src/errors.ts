import { createCoreError } from '@trailhead/core';
import type { CoreError } from '@trailhead/core';

// ========================================
// Error Factory Functions
// ========================================

export const createDataError = (
  message: string,
  details?: string,
  cause?: unknown,
  context?: Record<string, unknown>
): CoreError =>
  createCoreError('DataError', message, {
    details,
    cause,
    context,
    recoverable: true,
    suggestion: 'Check data format and processing options',
  });

export const createCSVError = (
  message: string,
  details?: string,
  cause?: unknown,
  context?: Record<string, unknown>
): CoreError =>
  createCoreError('CSVError', message, {
    details,
    cause,
    context,
    recoverable: true,
    suggestion: 'Verify CSV format, delimiter, and encoding',
  });

export const createJSONError = (
  message: string,
  details?: string,
  cause?: unknown,
  context?: Record<string, unknown>
): CoreError =>
  createCoreError('JSONError', message, {
    details,
    cause,
    context,
    recoverable: true,
    suggestion: 'Check JSON syntax and structure',
  });

export const createExcelError = (
  message: string,
  details?: string,
  cause?: unknown,
  context?: Record<string, unknown>
): CoreError =>
  createCoreError('ExcelError', message, {
    details,
    cause,
    context,
    recoverable: true,
    suggestion: 'Verify Excel file format and worksheet configuration',
  });

export const createParsingError = (
  message: string,
  details?: string,
  cause?: unknown,
  context?: Record<string, unknown>
): CoreError =>
  createCoreError('ParsingError', message, {
    details,
    cause,
    context,
    recoverable: false,
    suggestion: 'Review data format and parsing configuration',
  });

export const createValidationError = (
  message: string,
  details?: string,
  cause?: unknown,
  context?: Record<string, unknown>
): CoreError =>
  createCoreError('ValidationError', message, {
    details,
    cause,
    context,
    recoverable: true,
    suggestion: 'Check data integrity and validation rules',
  });

export const createFormatDetectionError = (
  message: string,
  details?: string,
  cause?: unknown,
  context?: Record<string, unknown>
): CoreError =>
  createCoreError('FormatDetectionError', message, {
    details,
    cause,
    context,
    recoverable: true,
    suggestion: 'Specify format explicitly or check file content',
  });

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
    suggestion: 'Verify source and target format compatibility',
  });

// ========================================
// Error Mapping Utilities
// ========================================

export const mapNodeError = (operation: string, path: string, error: unknown): CoreError => {
  const errorMessage = error instanceof Error ? error.message : String(error);

  return createDataError(
    `${operation} failed`,
    `Operation: ${operation}, Path: ${path}, Error: ${errorMessage}`,
    error,
    { operation, path }
  );
};

export const mapLibraryError = (library: string, operation: string, error: unknown): CoreError => {
  const errorMessage = error instanceof Error ? error.message : String(error);

  return createDataError(
    `${library} operation failed`,
    `Library: ${library}, Operation: ${operation}, Error: ${errorMessage}`,
    error,
    { library, operation }
  );
};

export const mapValidationError = (field: string, value: unknown, error: unknown): CoreError => {
  const errorMessage = error instanceof Error ? error.message : String(error);

  return createValidationError(
    `Validation failed for field: ${field}`,
    `Field: ${field}, Value: ${JSON.stringify(value)}, Error: ${errorMessage}`,
    error,
    { field, value }
  );
};
