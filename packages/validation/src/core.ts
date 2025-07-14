import { z } from 'zod';
import { ok, err } from '@esteban-url/core';
import { createValidationError, zodErrorToValidationError } from './errors.js';
import type { ValidationResult, ValidatorFn, ValidationConfig, SchemaValidator } from './types.js';

// Default configuration
export const defaultValidationConfig: ValidationConfig = {
  abortEarly: true,
  stripUnknown: false,
  allowUnknown: false,
} as const;

// Core validation utilities with dependency injection
export const createValidator =
  <T, R = T>(
    schema: z.ZodType<R>,
    _config: ValidationConfig = defaultValidationConfig
  ): ValidatorFn<T, R> =>
  (value: T): ValidationResult<R> => {
    const result = schema.safeParse(value);

    if (!result.success) {
      return err(zodErrorToValidationError(result.error));
    }

    return ok(result.data);
  };

export const createSchemaValidator = <T>(
  schema: z.ZodType<T>,
  _config: ValidationConfig = defaultValidationConfig
): SchemaValidator<T> => ({
  schema,
  validate: createValidator(schema, _config),
});

// Common validation functions
export const validateEmail =
  (_config: ValidationConfig = defaultValidationConfig): ValidatorFn<string> =>
  (email: string): ValidationResult<string> => {
    if (!email || email.trim().length === 0) {
      return err(
        createValidationError('Email is required', {
          field: 'email',
          value: email,
          suggestion: 'Provide a valid email address',
        })
      );
    }

    const schema = z.string().email('Invalid email format');
    const result = schema.safeParse(email);

    if (!result.success) {
      return err(zodErrorToValidationError(result.error, { field: 'email' }));
    }

    return ok(result.data);
  };

export const validateUrl =
  (_config: ValidationConfig = defaultValidationConfig): ValidatorFn<string> =>
  (url: string): ValidationResult<string> => {
    if (!url || url.trim().length === 0) {
      return err(
        createValidationError('URL is required', {
          field: 'url',
          value: url,
          suggestion: 'Provide a valid URL',
        })
      );
    }

    const schema = z.string().url('Invalid URL format');
    const result = schema.safeParse(url);

    if (!result.success) {
      return err(zodErrorToValidationError(result.error, { field: 'url' }));
    }

    return ok(result.data);
  };

export const validatePhoneNumber =
  (_config: ValidationConfig = defaultValidationConfig): ValidatorFn<string> =>
  (phone: string): ValidationResult<string> => {
    if (!phone || phone.trim().length === 0) {
      return err(
        createValidationError('Phone number is required', {
          field: 'phone',
          value: phone,
          suggestion: 'Provide a valid phone number',
        })
      );
    }

    const schema = z
      .string()
      .regex(/^\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$|^\d{10}$/, 'Invalid phone number format');
    const result = schema.safeParse(phone);

    if (!result.success) {
      return err(zodErrorToValidationError(result.error, { field: 'phone' }));
    }

    return ok(result.data);
  };

export const validateStringLength =
  (
    min: number,
    max?: number,
    _config: ValidationConfig = defaultValidationConfig
  ): ValidatorFn<string> =>
  (value: string): ValidationResult<string> => {
    let schema = z.string().min(min, `Value must be at least ${min} characters long`);

    if (max !== undefined) {
      schema = schema.max(max, `Value must be no more than ${max} characters long`);
    }

    const result = schema.safeParse(value);

    if (!result.success) {
      return err(zodErrorToValidationError(result.error));
    }

    return ok(result.data);
  };

export const validateNumberRange =
  (
    min?: number,
    max?: number,
    _config: ValidationConfig = defaultValidationConfig
  ): ValidatorFn<number> =>
  (value: number): ValidationResult<number> => {
    let schema = z.number();

    if (min !== undefined) {
      schema = schema.min(min, `Value must be at least ${min}`);
    }

    if (max !== undefined) {
      schema = schema.max(max, `Value must be no more than ${max}`);
    }

    const result = schema.safeParse(value);

    if (!result.success) {
      return err(zodErrorToValidationError(result.error));
    }

    return ok(result.data);
  };

export const validateRequired =
  <T>(_config: ValidationConfig = defaultValidationConfig): ValidatorFn<T | null | undefined, T> =>
  (value: T | null | undefined): ValidationResult<T> => {
    const schema = z
      .any()
      .refine(val => val !== null && val !== undefined && val !== '', 'Value is required');
    const result = schema.safeParse(value);

    if (!result.success) {
      return err(zodErrorToValidationError(result.error));
    }

    return ok(result.data);
  };

export const validateCurrency =
  (_config: ValidationConfig = defaultValidationConfig): ValidatorFn<number> =>
  (value: number): ValidationResult<number> => {
    const schema = z
      .number()
      .nonnegative('Currency value must be positive')
      .refine(
        val => Math.round(val * 100) / 100 === val,
        'Currency value must have at most 2 decimal places'
      );

    const result = schema.safeParse(value);

    if (!result.success) {
      return err(zodErrorToValidationError(result.error));
    }

    return ok(result.data);
  };

export const validateDate =
  (_config: ValidationConfig = defaultValidationConfig): ValidatorFn<string, Date> =>
  (dateString: string): ValidationResult<Date> => {
    if (!dateString || dateString.trim().length === 0) {
      return err(
        createValidationError('Date is required', {
          field: 'date',
          value: dateString,
          suggestion: 'Provide a valid date string',
        })
      );
    }

    const schema = z
      .string()
      .datetime({ message: 'Invalid date format' })
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'));
    const result = schema.safeParse(dateString);

    if (!result.success) {
      return err(zodErrorToValidationError(result.error, { field: 'date' }));
    }

    const date = new Date(result.data);
    if (isNaN(date.getTime())) {
      return err(
        createValidationError('Invalid date format', {
          field: 'date',
          value: dateString,
          suggestion: 'Provide a valid date string in ISO format',
        })
      );
    }

    // For YYYY-MM-DD format, validate that the date doesn't roll over
    if (/^\d{4}-\d{2}-\d{2}$/.test(result.data)) {
      const [year, month, day] = result.data.split('-').map(Number);
      // Use UTC to avoid timezone issues
      const utcDate = new Date(Date.UTC(year, month - 1, day));
      if (
        utcDate.getUTCFullYear() !== year ||
        utcDate.getUTCMonth() !== month - 1 ||
        utcDate.getUTCDate() !== day
      ) {
        return err(
          createValidationError('Invalid date format', {
            field: 'date',
            value: dateString,
            suggestion: 'Provide a valid date (check month/day validity)',
          })
        );
      }
      // Return the UTC date for consistency
      return ok(utcDate);
    }

    return ok(date);
  };

// Composition utilities
export const validateArray =
  <T, R = T>(
    validator: ValidatorFn<T, R>,
    _config: ValidationConfig = defaultValidationConfig
  ): ValidatorFn<T[], R[]> =>
  (items: T[]): ValidationResult<R[]> => {
    const schema = z.array(z.any());
    const arrayResult = schema.safeParse(items);

    if (!arrayResult.success) {
      return err(zodErrorToValidationError(arrayResult.error));
    }

    const validatedItems: R[] = [];

    for (let i = 0; i < items.length; i++) {
      const result = validator(items[i]);
      if (result.isErr()) {
        return err(
          createValidationError(`Item at index ${i}: ${result.error.message}`, {
            field: `[${i}]`,
            value: items[i],
            cause: result.error,
          })
        );
      }
      validatedItems.push(result.value);
    }

    return ok(validatedItems);
  };

export const validateObject =
  <T extends Record<string, any>>(
    validators: Partial<{ [K in keyof T]: ValidatorFn<T[K]> }>,
    _config: ValidationConfig = defaultValidationConfig
  ): ValidatorFn<T> =>
  (obj: T): ValidationResult<T> => {
    const schema = z.object({});
    const objectResult = schema.safeParse(obj);

    if (!objectResult.success) {
      return err(zodErrorToValidationError(objectResult.error));
    }

    const validatedObj = { ...obj };

    for (const [field, validator] of Object.entries(validators)) {
      const fieldValue = obj[field as keyof T];
      const result = validator(fieldValue);

      if (result.isErr()) {
        return err(
          createValidationError(`Field ${field}: ${result.error.message}`, {
            field,
            value: fieldValue,
            cause: result.error,
          })
        );
      }

      validatedObj[field as keyof T] = result.value;
    }

    return ok(validatedObj);
  };

// Validation composition
export const composeValidators =
  <T, R1, R2>(first: ValidatorFn<T, R1>, second: ValidatorFn<R1, R2>): ValidatorFn<T, R2> =>
  (value: T): ValidationResult<R2> => {
    const firstResult = first(value);
    if (firstResult.isErr()) return err(firstResult.error);

    return second(firstResult.value);
  };

export const anyOf =
  <T>(...validators: ValidatorFn<T>[]): ValidatorFn<T> =>
  (value: T): ValidationResult<T> => {
    const errors: string[] = [];

    for (const validator of validators) {
      const result = validator(value);
      if (result.isOk()) return result;
      errors.push(result.error.message);
    }

    return err(
      createValidationError(`All validations failed: ${errors.join(', ')}`, {
        value,
        constraints: { attempts: errors.length },
      })
    );
  };

export const allOf =
  <T>(...validators: ValidatorFn<T>[]): ValidatorFn<T> =>
  (value: T): ValidationResult<T> => {
    for (const validator of validators) {
      const result = validator(value);
      if (result.isErr()) return result;
    }

    return ok(value);
  };
