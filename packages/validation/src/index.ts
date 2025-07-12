// Types
export type {
  ValidationError,
  ValidationResult,
  ValidatorFn,
  AsyncValidatorFn,
  SchemaValidator,
  ValidationConfig,
} from './types.js';

// Error utilities
export {
  createValidationError,
  createRequiredFieldError,
  createInvalidTypeError,
  zodErrorToValidationError,
} from './errors.js';

// Core validation functions
export {
  defaultValidationConfig,
  createValidator,
  createSchemaValidator,
  validateEmail,
  validateUrl,
  validatePhoneNumber,
  validateStringLength,
  validateNumberRange,
  validateRequired,
  validateCurrency,
  validateDate,
  validateArray,
  validateObject,
  composeValidators,
  anyOf,
  allOf,
} from './core.js';

// Import for convenience object
import {
  defaultValidationConfig,
  validateEmail,
  validateUrl,
  validatePhoneNumber,
  validateStringLength,
  validateNumberRange,
  validateRequired,
  validateCurrency,
  validateDate,
  validateArray,
  validateObject,
} from './core.js';

// Convenience exports with default config (for drop-in replacement)
export const validate = {
  email: validateEmail(),
  url: validateUrl(),
  phoneNumber: validatePhoneNumber(),
  stringLength: (min: number, max?: number) =>
    validateStringLength(min, max, defaultValidationConfig),
  numberRange: (min?: number, max?: number) =>
    validateNumberRange(min, max, defaultValidationConfig),
  required: validateRequired<any>(),
  currency: validateCurrency(),
  date: validateDate(),
  array: <T, _R = T>(validator: (value: T) => any) =>
    validateArray(validator, defaultValidationConfig),
  object: <_T extends Record<string, any>>(validators: any) =>
    validateObject(validators, defaultValidationConfig),
};

// Re-export Zod for custom schemas
export { z } from 'zod';

// Re-export Result types for convenience
export { ok, err } from '@trailhead/core';
export type { Result } from '@trailhead/core';
