import { z } from 'zod'
import { ok, err } from '@esteban-url/core'
import { createValidationError, zodErrorToValidationError } from './errors.js'
import type { ValidationResult, ValidatorFn, ValidationConfig, SchemaValidator } from './types.js'

// Default configuration
export const defaultValidationConfig: ValidationConfig = {
  abortEarly: true,
  stripUnknown: false,
  allowUnknown: false,
} as const

// Core validation utilities with dependency injection
export const createValidator =
  <T, R = T>(
    schema: z.ZodType<R>,
    _config: ValidationConfig = defaultValidationConfig
  ): ValidatorFn<T, R> =>
  (value: T): ValidationResult<R> => {
    const result = schema.safeParse(value)

    if (!result.success) {
      return err(zodErrorToValidationError(result.error))
    }

    return ok(result.data)
  }

export const createSchemaValidator = <T>(
  schema: z.ZodType<T>,
  _config: ValidationConfig = defaultValidationConfig
): SchemaValidator<T> => ({
  schema,
  validate: createValidator(schema, _config),
})

/**
 * Creates an email validator function with configurable validation rules.
 *
 * Validates email addresses according to standard RFC 5322 format
 * with user-friendly error messages and suggestions.
 *
 * @param _config Optional validation configuration
 * @returns Email validator function
 *
 * @example
 * ```typescript
 * const emailValidator = validateEmail();
 *
 * // Valid email
 * const result = emailValidator('user@example.com');
 * if (result.isOk()) {
 *   console.log('Valid email:', result.value);
 * }
 *
 * // Invalid email
 * const result2 = emailValidator('invalid-email');
 * if (result2.isErr()) {
 *   console.log(result2.error.message); // "Invalid email format..."
 *   console.log(result2.error.suggestion); // "Provide a valid email address..."
 * }
 *
 * // Empty email
 * const result3 = emailValidator('');
 * if (result3.isErr()) {
 *   console.log(result3.error.message); // "Email is required"
 * }
 * ```
 */
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
      )
    }

    const schema = z.string().email({
      error: 'Invalid email format. Please provide a valid email address like user@example.com',
    })
    const result = schema.safeParse(email)

    if (!result.success) {
      return err(zodErrorToValidationError(result.error, { field: 'email' }))
    }

    return ok(result.data)
  }

/**
 * Creates a URL validator function with configurable validation rules.
 *
 * Validates URLs to ensure they have proper protocol and format,
 * supporting both HTTP and HTTPS URLs with user-friendly error messages.
 *
 * @param _config Optional validation configuration
 * @returns URL validator function
 *
 * @example
 * ```typescript
 * const urlValidator = validateUrl();
 *
 * // Valid URLs
 * urlValidator('https://example.com').isOk(); // true
 * urlValidator('http://sub.example.com/path').isOk(); // true
 * urlValidator('https://example.com:8080').isOk(); // true
 *
 * // Invalid URLs
 * const result = urlValidator('example.com'); // Missing protocol
 * if (result.isErr()) {
 *   console.log(result.error.message); // "Invalid URL format..."
 * }
 *
 * // Use in form validation
 * const websiteField = document.querySelector('#website');
 * const validation = urlValidator(websiteField.value);
 * if (validation.isErr()) {
 *   showError(validation.error.message);
 * }
 * ```
 */
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
      )
    }

    const schema = z.string().url({
      error: 'Invalid URL format. Please provide a valid URL like https://example.com',
    })
    const result = schema.safeParse(url)

    if (!result.success) {
      return err(zodErrorToValidationError(result.error, { field: 'url' }))
    }

    return ok(result.data)
  }

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
      )
    }

    const schema = z.string().regex(/^\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$|^\d{10}$/, {
      error: 'Invalid phone number format. Please provide a valid phone number like (555) 123-4567',
    })
    const result = schema.safeParse(phone)

    if (!result.success) {
      return err(zodErrorToValidationError(result.error, { field: 'phone' }))
    }

    return ok(result.data)
  }

export const validateStringLength =
  (
    min: number,
    max?: number,
    _config: ValidationConfig = defaultValidationConfig
  ): ValidatorFn<string> =>
  (value: string): ValidationResult<string> => {
    let schema = z.string().min(min, {
      error: (issue) => {
        if (issue.code === 'too_small') {
          return `Value must be at least ${issue.minimum} characters long`
        }
        return 'Invalid string length'
      },
    })

    if (max !== undefined) {
      schema = schema.max(max, {
        error: (issue) => {
          if (issue.code === 'too_big') {
            return `Value must be no more than ${issue.maximum} characters long`
          }
          return 'Invalid string length'
        },
      })
    }

    const result = schema.safeParse(value)

    if (!result.success) {
      return err(zodErrorToValidationError(result.error))
    }

    return ok(result.data)
  }

export const validateNumberRange =
  (
    min?: number,
    max?: number,
    _config: ValidationConfig = defaultValidationConfig
  ): ValidatorFn<number> =>
  (value: number): ValidationResult<number> => {
    let schema = z.number({
      error: (issue) => {
        if (issue.code === 'invalid_type') {
          return `Expected a number, received ${typeof issue.input}`
        }
        return 'Invalid number'
      },
    })

    if (min !== undefined) {
      schema = schema.min(min, {
        error: (issue) => {
          if (issue.code === 'too_small') {
            return `Value must be at least ${issue.minimum}`
          }
          return 'Number is too small'
        },
      })
    }

    if (max !== undefined) {
      schema = schema.max(max, {
        error: (issue) => {
          if (issue.code === 'too_big') {
            return `Value must be no more than ${issue.maximum}`
          }
          return 'Number is too large'
        },
      })
    }

    const result = schema.safeParse(value)

    if (!result.success) {
      return err(zodErrorToValidationError(result.error))
    }

    return ok(result.data)
  }

export const validateRequired =
  <T>(_config: ValidationConfig = defaultValidationConfig): ValidatorFn<T | null | undefined, T> =>
  (value: T | null | undefined): ValidationResult<T> => {
    const schema = z.any().refine((val) => val !== null && val !== undefined && val !== '', {
      error: 'Value is required',
    })
    const result = schema.safeParse(value)

    if (!result.success) {
      return err(zodErrorToValidationError(result.error))
    }

    return ok(result.data)
  }

export const validateCurrency =
  (_config: ValidationConfig = defaultValidationConfig): ValidatorFn<number> =>
  (value: number): ValidationResult<number> => {
    const schema = z
      .number({
        error: (issue) => {
          if (issue.code === 'invalid_type') {
            return 'Currency value must be a number'
          }
          return 'Invalid currency value'
        },
      })
      .nonnegative({
        error: 'Currency value must be positive',
      })
      .refine((val) => Math.round(val * 100) / 100 === val, {
        error: 'Currency value must have at most 2 decimal places',
      })

    const result = schema.safeParse(value)

    if (!result.success) {
      return err(zodErrorToValidationError(result.error))
    }

    return ok(result.data)
  }

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
      )
    }

    const schema = z
      .string()
      .datetime({ error: 'Invalid date format. Please provide a valid ISO 8601 date' })
      .or(
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
          error: 'Invalid date format. Please provide a date in YYYY-MM-DD format',
        })
      )
    const result = schema.safeParse(dateString)

    if (!result.success) {
      return err(zodErrorToValidationError(result.error, { field: 'date' }))
    }

    const date = new Date(result.data)
    if (isNaN(date.getTime())) {
      return err(
        createValidationError('Invalid date format', {
          field: 'date',
          value: dateString,
          suggestion: 'Provide a valid date string in ISO format',
        })
      )
    }

    // For YYYY-MM-DD format, validate that the date doesn't roll over
    if (/^\d{4}-\d{2}-\d{2}$/.test(result.data)) {
      const [year, month, day] = result.data.split('-').map(Number)
      // Use UTC to avoid timezone issues
      const utcDate = new Date(Date.UTC(year, month - 1, day))
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
        )
      }
      // Return the UTC date for consistency
      return ok(utcDate)
    }

    return ok(date)
  }

// Composition utilities
export const validateArray =
  <T, R = T>(
    validator: ValidatorFn<T, R>,
    _config: ValidationConfig = defaultValidationConfig
  ): ValidatorFn<T[], R[]> =>
  (items: T[]): ValidationResult<R[]> => {
    const schema = z.array(z.any())
    const arrayResult = schema.safeParse(items)

    if (!arrayResult.success) {
      return err(zodErrorToValidationError(arrayResult.error))
    }

    const validatedItems: R[] = []

    for (let i = 0; i < items.length; i++) {
      const result = validator(items[i])
      if (result.isErr()) {
        return err(
          createValidationError(`Item at index ${i}: ${result.error.message}`, {
            field: `[${i}]`,
            value: items[i],
            cause: result.error,
          })
        )
      }
      validatedItems.push(result.value)
    }

    return ok(validatedItems)
  }

export const validateObject =
  <T extends Record<string, any>>(
    validators: Partial<{ [K in keyof T]: ValidatorFn<T[K]> }>,
    _config: ValidationConfig = defaultValidationConfig
  ): ValidatorFn<T> =>
  (obj: T): ValidationResult<T> => {
    const schema = z.object({})
    const objectResult = schema.safeParse(obj)

    if (!objectResult.success) {
      return err(zodErrorToValidationError(objectResult.error))
    }

    const validatedObj = { ...obj }

    for (const [field, validator] of Object.entries(validators)) {
      const fieldValue = obj[field as keyof T]
      const result = validator(fieldValue)

      if (result.isErr()) {
        return err(
          createValidationError(`Field ${field}: ${result.error.message}`, {
            field,
            value: fieldValue,
            cause: result.error,
          })
        )
      }

      validatedObj[field as keyof T] = result.value
    }

    return ok(validatedObj)
  }

// Validation composition
export const composeValidators =
  <T, R1, R2>(first: ValidatorFn<T, R1>, second: ValidatorFn<R1, R2>): ValidatorFn<T, R2> =>
  (value: T): ValidationResult<R2> => {
    const firstResult = first(value)
    if (firstResult.isErr()) return err(firstResult.error)

    return second(firstResult.value)
  }

export const anyOf =
  <T>(...validators: ValidatorFn<T>[]): ValidatorFn<T> =>
  (value: T): ValidationResult<T> => {
    const errors: string[] = []

    for (const validator of validators) {
      const result = validator(value)
      if (result.isOk()) return result
      errors.push(result.error.message)
    }

    return err(
      createValidationError(`All validations failed: ${errors.join(', ')}`, {
        value,
        constraints: { attempts: errors.length },
      })
    )
  }

export const allOf =
  <T>(...validators: ValidatorFn<T>[]): ValidatorFn<T> =>
  (value: T): ValidationResult<T> => {
    for (const validator of validators) {
      const result = validator(value)
      if (result.isErr()) return result
    }

    return ok(value)
  }
