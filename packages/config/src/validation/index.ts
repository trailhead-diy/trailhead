// ========================================
// Enhanced Config Validation Module
// ========================================

/**
 * Enhanced configuration validation error types for comprehensive error handling.
 *
 * Provides specialized error types for configuration validation with detailed
 * context, suggestions, and examples for better developer experience.
 */
export type {
  ConfigValidationError as ValidationError,
  ConfigValidationContext as ValidationContext,
} from './errors.js'

/**
 * Enhanced error creation functions for building detailed validation errors.
 *
 * These functions help create comprehensive validation errors with proper
 * context, suggestions, and examples for better debugging and user experience.
 */
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

/**
 * Enhanced validation error formatting types for customizable error presentation.
 *
 * Provides types for formatting validation errors in different ways including
 * interactive prompts, JSON output, and customizable formatter options.
 */
export type {
  ValidationErrorFormatter,
  InteractiveErrorInfo,
  ValidationErrorJson,
  FormatterOptions,
} from './formatters.js'

/**
 * Enhanced validation error formatting functions for presenting errors to users.
 *
 * These functions format validation errors in various ways including colored
 * terminal output, JSON format, and interactive error information extraction.
 */
export {
  createValidationErrorFormatter,
  formatValidationError,
  formatValidationErrors,
  formatValidationErrorsJson,
  extractValidationErrors,
} from './formatters.js'
