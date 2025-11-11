import { z } from 'zod'
import { ok, err } from '@trailhead/core'
import { createValidationError, zodErrorToValidationError } from './errors.js'
import type { ValidationResult, ValidatorFn, ValidationConfig, SchemaValidator } from './types.js'

// Default configuration
export const defaultValidationConfig: ValidationConfig = {
  abortEarly: true,
  stripUnknown: false,
  allowUnknown: false,
} as const

/**
 * Creates a validator function from a Zod schema.
 * Validates input values and returns Result with either validated data or error.
 *
 * @param schema - Zod schema to validate against
 * @param _config - Optional validation configuration
 * @returns Validator function that takes input and returns validation result
 */
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

/**
 * Creates a schema validator object with schema and validation function.
 *
 * @param schema - Zod schema to create validator from
 * @param _config - Optional validation configuration
 * @returns Schema validator with embedded schema and validate function
 */
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

/**
 * Creates a phone number validator function.
 * Validates US phone numbers in various formats (e.g., (555) 123-4567, 5551234567).
 *
 * @param _config - Optional validation configuration
 * @returns Phone number validator function
 *
 * @example
 * ```typescript
 * const validator = validatePhoneNumber();
 * validator('(555) 123-4567').isOk(); // true
 * validator('5551234567').isOk(); // true
 * validator('invalid').isErr(); // true
 * ```
 */
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

/**
 * Creates a string length validator with min/max constraints.
 *
 * @param min - Minimum required length
 * @param max - Optional maximum allowed length
 * @param _config - Optional validation configuration
 * @returns String length validator function
 */
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

/**
 * Creates a number range validator with min/max bounds.
 *
 * @param min - Optional minimum value
 * @param max - Optional maximum value
 * @param _config - Optional validation configuration
 * @returns Number range validator function
 */
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

/**
 * Creates a required field validator that rejects null, undefined, and empty strings.
 *
 * @param _config - Optional validation configuration
 * @returns Required field validator function
 */
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

/**
 * Creates a currency validator ensuring positive numbers with max 2 decimal places.
 *
 * @param _config - Optional validation configuration
 * @returns Currency validator function
 */
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

/**
 * Creates a date validator supporting ISO 8601 and YYYY-MM-DD formats.
 *
 * @param _config - Optional validation configuration
 * @returns Date validator function that returns Date object
 */
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

/**
 * Creates an array validator that applies a validator to each element.
 *
 * @param validator - Validator function to apply to each array element
 * @param _config - Optional validation configuration
 * @returns Array validator function
 */
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

/**
 * Creates an object validator that applies field-specific validators.
 *
 * @param validators - Map of field names to validator functions
 * @param _config - Optional validation configuration
 * @returns Object validator function
 */
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

/**
 * Composes two validators sequentially, passing output of first to second.
 *
 * @param first - First validator to apply
 * @param second - Second validator to apply to first's output
 * @returns Composed validator function
 */
export const composeValidators =
  <T, R1, R2>(first: ValidatorFn<T, R1>, second: ValidatorFn<R1, R2>): ValidatorFn<T, R2> =>
  (value: T): ValidationResult<R2> => {
    const firstResult = first(value)
    if (firstResult.isErr()) return err(firstResult.error)

    return second(firstResult.value)
  }

/**
 * Creates a validator that succeeds if any of the provided validators succeed.
 *
 * @param validators - Array of validator functions to try
 * @returns Combined validator using OR logic
 */
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

/**
 * Creates a validator that succeeds only if all provided validators succeed.
 *
 * @param validators - Array of validator functions to apply
 * @returns Combined validator using AND logic
 */
export const allOf =
  <T>(...validators: ValidatorFn<T>[]): ValidatorFn<T> =>
  (value: T): ValidationResult<T> => {
    for (const validator of validators) {
      const result = validator(value)
      if (result.isErr()) return result
    }

    return ok(value)
  }
