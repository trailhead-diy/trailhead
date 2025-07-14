/**
 * Schema builders for validation testing
 */

import { z } from 'zod'

/**
 * Common validation schemas for testing
 */
export const testSchemas = {
  /**
   * Basic string validation
   */
  string: z.string(),

  /**
   * Email validation
   */
  email: z.string().email(),

  /**
   * URL validation
   */
  url: z.string().url(),

  /**
   * Number validation
   */
  number: z.number(),

  /**
   * Positive number validation
   */
  positiveNumber: z.number().positive(),

  /**
   * Boolean validation
   */
  boolean: z.boolean(),

  /**
   * Array validation
   */
  array: z.array(z.string()),

  /**
   * Object validation
   */
  object: z.object({
    name: z.string(),
    value: z.number(),
  }),

  /**
   * Optional field validation
   */
  optional: z.object({
    required: z.string(),
    optional: z.string().optional(),
  }),

  /**
   * Union validation
   */
  union: z.union([z.string(), z.number()]),

  /**
   * Enum validation
   */
  enum: z.enum(['red', 'green', 'blue']),
}

/**
 * Creates test data for validation schemas
 */
export const createTestData = {
  /**
   * Valid test data
   */
  valid: {
    string: 'test',
    email: 'test@example.com',
    url: 'https://example.com',
    number: 42,
    positiveNumber: 10,
    boolean: true,
    array: ['a', 'b', 'c'],
    object: { name: 'test', value: 42 },
    optional: { required: 'test' },
    union: 'test',
    enum: 'red' as const,
  },

  /**
   * Invalid test data
   */
  invalid: {
    string: 123,
    email: 'invalid-email',
    url: 'not-a-url',
    number: 'not-a-number',
    positiveNumber: -5,
    boolean: 'not-a-boolean',
    array: 'not-an-array',
    object: { name: 'test' }, // missing value
    optional: {}, // missing required field
    union: true, // not string or number
    enum: 'purple', // not in enum
  },
}

/**
 * Validation test runner
 */
export const runValidationTests = <T>(
  schema: z.ZodSchema<T>,
  validData: unknown,
  invalidData: unknown
) => {
  const validResult = schema.safeParse(validData)
  const invalidResult = schema.safeParse(invalidData)

  return {
    valid: {
      success: validResult.success,
      data: validResult.success ? validResult.data : undefined,
      error: validResult.success ? undefined : validResult.error,
    },
    invalid: {
      success: invalidResult.success,
      data: invalidResult.success ? invalidResult.data : undefined,
      error: invalidResult.success ? undefined : invalidResult.error,
    },
  }
}
