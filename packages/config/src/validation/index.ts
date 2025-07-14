// ========================================
// Enhanced Config Validation Module
// ========================================

// Enhanced configuration validation error types
export type {
  ConfigValidationError as ValidationError,
  ConfigValidationContext as ValidationContext,
} from './errors.js'

// Enhanced error creation functions
export {
  createConfigValidationError as createValidationError,
  createSchemaValidationError,
  enhanceZodError,
  createMissingFieldError,
  createTypeError,
  createEnumError,
  createRangeError,
  createLengthError,
  createPatternError,
  isConfigValidationError as isValidationError,
  isSchemaValidationError,
} from './errors.js'

// Enhanced validation error formatting
export type {
  ValidationErrorFormatter,
  InteractiveErrorInfo,
  ValidationErrorJson,
  FormatterOptions,
} from './formatters.js'

export {
  createValidationErrorFormatter,
  formatValidationError,
  formatValidationErrors,
  formatValidationErrorsJson,
  extractValidationErrors,
} from './formatters.js'
