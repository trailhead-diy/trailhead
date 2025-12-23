/**
 * @module core/validation
 * @description Minimal Zod integration for Result-based validation
 */

import type { z } from 'zod'
import { err, ok } from './errors/utils.js'
import { createCoreError } from './errors/factory.js'
import type { CoreResult } from './errors/types.js'

/**
 * Result type alias for validation operations.
 * @template T - The validated value type
 */
export type ValidationResult<T> = CoreResult<T>

/**
 * Validates a value against a Zod schema and returns a Result.
 *
 * This is a thin wrapper around Zod's safeParse that integrates with
 * the Trailhead Result-based error handling system.
 *
 * @param schema - Zod schema to validate against
 * @param value - Value to validate
 * @returns Result containing validated value or CoreError
 *
 * @example
 * ```typescript
 * import { z } from 'zod'
 * import { validateWithSchema } from '@trailhead/core'
 *
 * const userSchema = z.object({
 *   name: z.string().min(1),
 *   email: z.string().email()
 * })
 *
 * const result = validateWithSchema(userSchema, { name: 'Alice', email: 'alice@example.com' })
 * if (result.isOk()) {
 *   console.log('Valid user:', result.value)
 * } else {
 *   console.error('Validation failed:', result.error.message)
 * }
 * ```
 */
export const validateWithSchema = <T>(
  schema: z.ZodType<T>,
  value: unknown
): ValidationResult<T> => {
  const result = schema.safeParse(value)

  if (result.success) {
    return ok(result.data)
  }

  return err(
    createCoreError('ValidationError', 'SCHEMA_VALIDATION_FAILED', result.error.message, {
      component: 'validation',
      operation: 'validateWithSchema',
      recoverable: true,
      severity: 'medium',
      context: { issues: result.error.issues },
    })
  )
}

/**
 * Creates a validator function from a Zod schema.
 *
 * Useful when you need to pass a validator function to higher-order functions
 * or want to reuse the same schema validation in multiple places.
 *
 * @param schema - Zod schema to create validator from
 * @returns Validator function that takes a value and returns a Result
 *
 * @example
 * ```typescript
 * import { z } from 'zod'
 * import { createValidator } from '@trailhead/core'
 *
 * const validateEmail = createValidator(z.string().email())
 *
 * const result = validateEmail('test@example.com')
 * ```
 */
export const createValidator =
  <T>(schema: z.ZodType<T>) =>
  (value: unknown): ValidationResult<T> =>
    validateWithSchema(schema, value)
