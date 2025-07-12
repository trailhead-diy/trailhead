// ========================================
// Validation Module Exports
// ========================================

// Core validation error types and functions
export type {
  ConfigValidationError as ValidationError,
  ConfigValidationContext as ValidationErrorContext,
} from './errors.js';

export {
  createValidationError,
  createSchemaValidationError,
  createMissingFieldError,
  createTypeError,
  createEnumError,
  createRangeError,
  createLengthError,
  createPatternError,
  isValidationError,
  isSchemaValidationError,
} from './errors.js';

// Validation error formatting
export type {
  ValidationErrorFormatter,
  InteractiveErrorInfo,
  ValidationErrorJson,
  FormatterOptions,
} from './formatters.js';

export {
  createValidationErrorFormatter,
  formatValidationError,
  formatValidationErrors,
  formatValidationErrorsJson,
  extractValidationErrors,
} from './formatters.js';
