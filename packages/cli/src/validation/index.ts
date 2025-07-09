/**
 * @fileoverview TypeScript-first validation helpers using Zod
 *
 * This module provides Zod-based validation functions for common data validation needs.
 * All functions return Result<T, ValidationError> for consistent error handling.
 */

import { z } from 'zod';
import type { Result } from '../core/errors/types.js';
import type { ValidationError } from '../core/errors/types.js';
import { Ok, Err, validationError } from '../core/errors/factory.js';

/**
 * Convert Zod error to ValidationError
 */
function zodErrorToValidationError(error: z.ZodError): ValidationError {
  const firstError = error.errors[0];
  return validationError(firstError.message);
}

/**
 * Validate email format using Zod
 */
export function validateEmail(email: string): Result<string, ValidationError> {
  // Check for empty string first
  if (!email || email.trim().length === 0) {
    return Err(validationError('Email is required'));
  }

  const schema = z.string().email('Invalid email format');
  const result = schema.safeParse(email);

  if (!result.success) {
    return Err(zodErrorToValidationError(result.error));
  }

  return Ok(result.data);
}

/**
 * Validate phone number (US format) using Zod
 */
export function validatePhoneNumber(phone: string): Result<string, ValidationError> {
  // Check for empty string first
  if (!phone || phone.trim().length === 0) {
    return Err(validationError('Phone number is required'));
  }

  const schema = z
    .string()
    .regex(/^\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$|^\d{10}$/, 'Invalid phone number format');
  const result = schema.safeParse(phone);

  if (!result.success) {
    return Err(zodErrorToValidationError(result.error));
  }

  return Ok(result.data);
}

/**
 * Validate URL format using Zod
 */
export function validateUrl(url: string): Result<string, ValidationError> {
  // Check for empty string first
  if (!url || url.trim().length === 0) {
    return Err(validationError('URL is required'));
  }

  const schema = z.string().url('Invalid URL format');
  const result = schema.safeParse(url);

  if (!result.success) {
    return Err(zodErrorToValidationError(result.error));
  }

  return Ok(result.data);
}

/**
 * Validate string length using Zod
 */
export function validateStringLength(
  value: string,
  min: number,
  max?: number
): Result<string, ValidationError> {
  let schema = z.string().min(min, `Value must be at least ${min} characters long`);

  if (max !== undefined) {
    schema = schema.max(max, `Value must be no more than ${max} characters long`);
  }

  const result = schema.safeParse(value);

  if (!result.success) {
    return Err(zodErrorToValidationError(result.error));
  }

  return Ok(result.data);
}

/**
 * Validate number range using Zod
 */
export function validateNumberRange(
  value: number,
  min?: number,
  max?: number
): Result<number, ValidationError> {
  let schema = z.number();

  if (min !== undefined) {
    schema = schema.min(min, `Value must be at least ${min}`);
  }

  if (max !== undefined) {
    schema = schema.max(max, `Value must be no more than ${max}`);
  }

  const result = schema.safeParse(value);

  if (!result.success) {
    return Err(zodErrorToValidationError(result.error));
  }

  return Ok(result.data);
}

/**
 * Validate required field using Zod
 */
export function validateRequired<T>(value: T | null | undefined): Result<T, ValidationError> {
  const schema = z
    .any()
    .refine(val => val !== null && val !== undefined && val !== '', 'Value is required');
  const result = schema.safeParse(value);

  if (!result.success) {
    return Err(zodErrorToValidationError(result.error));
  }

  return Ok(result.data);
}

/**
 * Validate currency amount using Zod
 */
export function validateCurrency(value: number): Result<number, ValidationError> {
  const schema = z
    .number()
    .nonnegative('Currency value must be positive')
    .refine(
      val => Math.round(val * 100) / 100 === val,
      'Currency value must have at most 2 decimal places'
    );

  const result = schema.safeParse(value);

  if (!result.success) {
    return Err(zodErrorToValidationError(result.error));
  }

  return Ok(result.data);
}

/**
 * Validate date string using Zod
 */
export function validateDate(dateString: string): Result<Date, ValidationError> {
  // Check for empty string first
  if (!dateString || dateString.trim().length === 0) {
    return Err(validationError('Date is required'));
  }

  const schema = z
    .string()
    .datetime({ message: 'Invalid date format' })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'));
  const result = schema.safeParse(dateString);

  if (!result.success) {
    return Err(zodErrorToValidationError(result.error));
  }

  const date = new Date(result.data);
  if (isNaN(date.getTime())) {
    return Err(validationError('Invalid date format'));
  }

  return Ok(date);
}

/**
 * Validate array of items with a validator function using Zod
 */
export function validateArray<T>(
  items: T[],
  validator: (item: T) => Result<T, ValidationError>
): Result<T[], ValidationError> {
  const schema = z.array(z.any());
  const arrayResult = schema.safeParse(items);

  if (!arrayResult.success) {
    return Err(zodErrorToValidationError(arrayResult.error));
  }

  const validatedItems: T[] = [];

  for (let i = 0; i < items.length; i++) {
    const result = validator(items[i]);
    if (!result.success) {
      return Err(validationError(`Item at index ${i}: ${result.error.message}`));
    }
    validatedItems.push(result.value);
  }

  return Ok(validatedItems);
}

/**
 * Validate object with field validators using Zod
 */
export function validateObject<T extends Record<string, any>>(
  obj: T,
  validators: Partial<{ [K in keyof T]: (value: T[K]) => Result<T[K], ValidationError> }>
): Result<T, ValidationError> {
  const schema = z.object({});
  const objectResult = schema.safeParse(obj);

  if (!objectResult.success) {
    return Err(zodErrorToValidationError(objectResult.error));
  }

  const validatedObj = { ...obj };

  for (const [field, validator] of Object.entries(validators)) {
    const fieldValue = obj[field as keyof T];
    const result = validator(fieldValue);

    if (!result.success) {
      return Err(validationError(`Field ${field}: ${result.error.message}`));
    }

    validatedObj[field as keyof T] = result.value;
  }

  return Ok(validatedObj);
}

// Re-export core utilities for convenience
export { isOk, isErr, unwrap, unwrapOr, map, chain, Ok, Err } from '../core/errors/index.js';

export type { Result, ValidationError } from '../core/errors/types.js';

// Re-export Zod for users who want to create custom schemas
export { z } from 'zod';
