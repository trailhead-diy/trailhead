import { z } from 'zod'
import { createValidator } from './core.js'
import type { ValidationConfig, ValidatorFn } from './types.js'

/**
 * Reusable schema building blocks to eliminate duplication across packages.
 * These schemas provide consistent validation patterns and error messages.
 */

// === Basic Type Schemas ===

/**
 * Email validation schema with consistent error messaging
 *
 * Creates a Zod schema for email validation with RFC 5321 compliance,
 * including length limits and user-friendly error messages.
 *
 * @returns Zod email schema
 *
 * @example
 * ```typescript
 * // Direct schema usage
 * const schema = emailSchema();
 * const result = schema.safeParse('user@example.com');
 *
 * // In a user registration form
 * const userSchema = z.object({
 *   email: emailSchema(),
 *   password: passwordSchema()
 * });
 *
 * // With custom validator
 * const emailValidator = createValidator(emailSchema());
 * const validation = emailValidator('invalid.email');
 * if (validation.isErr()) {
 *   console.log(validation.error.message);
 * }
 * ```
 */
export const emailSchema = () =>
  z
    .string({
      error: (issue) => {
        if (issue.code === 'invalid_type') {
          return 'Email must be a string'
        }
        return 'Invalid email'
      },
    })
    .min(1, { error: 'Email is required' })
    .email({ error: 'Please enter a valid email address' })
    .max(254, { error: 'Email address is too long' }) // RFC 5321 limit

/**
 * URL validation schema with protocol requirements
 */
export const urlSchema = (options: { requireHttps?: boolean } = {}) => {
  const baseSchema = z
    .string({
      error: (issue) => {
        if (issue.code === 'invalid_type') {
          return 'URL must be a string'
        }
        return 'Invalid URL'
      },
    })
    .url({ error: 'Please enter a valid URL' })

  if (options.requireHttps) {
    return baseSchema.refine((url) => url.startsWith('https://'), {
      error: 'URL must use HTTPS protocol',
    })
  }

  return baseSchema
}

/**
 * Phone number validation schema with international support
 */
export const phoneSchema = () =>
  z
    .string({
      error: (issue) => {
        if (issue.code === 'invalid_type') {
          return 'Phone number must be a string'
        }
        return 'Invalid phone number'
      },
    })
    .min(1, { error: 'Phone number is required' })
    .regex(/^[+]?[1-9][\d\s\-()]{7,15}$/, {
      error: 'Please enter a valid phone number (e.g., +1-234-567-8900)',
    })

// === String Validation Schemas ===

/**
 * String length validation with configurable min/max
 */
export const stringLengthSchema = (min: number = 1, max?: number, fieldName: string = 'Value') => {
  let schema = z
    .string({
      error: (issue) => {
        if (issue.code === 'invalid_type') {
          return `${fieldName} must be a string`
        }
        return `Invalid ${fieldName.toLowerCase()}`
      },
    })
    .min(min, {
      error: (issue) => {
        if (issue.code === 'too_small') {
          return `${fieldName} must be at least ${issue.minimum} characters`
        }
        return `${fieldName} is too short`
      },
    })

  if (max !== undefined) {
    schema = schema.max(max, {
      error: (issue) => {
        if (issue.code === 'too_big') {
          return `${fieldName} must be no more than ${issue.maximum} characters`
        }
        return `${fieldName} is too long`
      },
    })
  }

  return schema
}

/**
 * Non-empty string schema
 */
export const nonEmptyStringSchema = (fieldName: string = 'Value') =>
  z
    .string({
      error: (issue) => {
        if (issue.code === 'invalid_type') {
          return `${fieldName} must be a string`
        }
        return `Invalid ${fieldName.toLowerCase()}`
      },
    })
    .min(1, { error: `${fieldName} cannot be empty` })

/**
 * Trimmed string schema that normalizes whitespace
 */
export const trimmedStringSchema = (fieldName: string = 'Value') =>
  z
    .string({
      error: (issue) => {
        if (issue.code === 'invalid_type') {
          return `${fieldName} must be a string`
        }
        return `Invalid ${fieldName.toLowerCase()}`
      },
    })
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, {
      error: `${fieldName} cannot be empty or only whitespace`,
    })

// === Project and Path Schemas ===

/**
 * Project name validation schema with npm package name rules
 *
 * Validates project names according to npm package naming conventions:
 * lowercase letters, numbers, hyphens, starting with letter, max 214 chars.
 *
 * @returns Zod schema for project name validation
 *
 * @example
 * ```typescript
 * // Validate CLI project name
 * const schema = projectNameSchema();
 *
 * // Valid names
 * schema.safeParse('my-awesome-cli').success; // true
 * schema.safeParse('cli-tool-2024').success; // true
 *
 * // Invalid names
 * schema.safeParse('MyProject').success; // false (uppercase)
 * schema.safeParse('_private').success; // false (starts with underscore)
 * schema.safeParse('@scoped/package').success; // false (contains @/)
 *
 * // In project configuration
 * const configSchema = z.object({
 *   name: projectNameSchema(),
 *   version: semverSchema(),
 *   description: nonEmptyStringSchema('Description')
 * });
 * ```
 */
export const projectNameSchema = () =>
  z
    .string({
      error: (issue) => {
        if (issue.code === 'invalid_type') {
          return 'Project name must be a string'
        }
        return 'Invalid project name'
      },
    })
    .min(1, { error: 'Project name is required' })
    .max(214, { error: 'Project name is too long (max 214 characters)' })
    .regex(/^[a-z0-9][a-z0-9._-]*$/, {
      error:
        'Project name must start with a letter or number and contain only lowercase letters, numbers, dots, hyphens, and underscores',
    })
    .refine((name) => !name.startsWith('.') && !name.startsWith('_'), {
      error: 'Project name cannot start with a dot or underscore',
    })
    .refine((name) => !['node_modules', 'favicon.ico'].includes(name), {
      error: 'Project name cannot be a reserved name',
    })

/**
 * Package manager validation schema
 */
export const packageManagerSchema = () =>
  z.enum(['npm', 'yarn', 'pnpm'], {
    error: (issue) => {
      if (issue.code === 'invalid_value') {
        const options = ['npm', 'yarn', 'pnpm']
        const received = (issue as any).received
        return `Package manager must be one of: ${options.join(', ')}${received !== undefined ? `, received "${received}"` : ''}`
      }
      return 'Invalid package manager'
    },
  })

/**
 * File path validation schema with security checks
 */
export const filePathSchema = (
  options: {
    allowAbsolute?: boolean
    allowTraversal?: boolean
    baseDir?: string
  } = {}
) => {
  const { allowAbsolute = false, allowTraversal = false, baseDir } = options

  return z
    .string({
      error: (issue) => {
        if (issue.code === 'invalid_type') {
          return 'File path must be a string'
        }
        return 'Invalid file path'
      },
    })
    .min(1, { error: 'File path cannot be empty' })
    .refine((path) => allowAbsolute || !path.startsWith('/'), {
      error: 'Absolute paths are not allowed',
    })
    .refine((path) => allowTraversal || !path.includes('../'), {
      error: 'Path traversal (..) is not allowed',
    })
    .refine((path) => !path.includes('\0'), {
      error: 'Path cannot contain null bytes',
    })
    .refine((path) => (baseDir ? path.startsWith(baseDir) : true), {
      error: baseDir ? `Path must be within ${baseDir}` : 'Invalid path',
    })
}

// === Author and Contact Schemas ===

/**
 * Author information schema for project generation
 */
export const authorSchema = () =>
  z.object({
    name: stringLengthSchema(1, 100, 'Author name'),
    email: emailSchema().optional(),
    url: urlSchema().optional(),
  })

// === Numeric Schemas ===

/**
 * Port number validation schema
 */
export const portSchema = () =>
  z
    .number({
      error: (issue) => {
        if (issue.code === 'invalid_type') {
          return 'Port must be a number'
        }
        return 'Invalid port'
      },
    })
    .int({ error: 'Port must be an integer' })
    .min(1, {
      error: (issue) => {
        if (issue.code === 'too_small') {
          const min = Number(issue.minimum)
          return `Port must be greater than ${min - 1}`
        }
        return 'Port is too small'
      },
    })
    .max(65535, {
      error: (issue) => {
        if (issue.code === 'too_big') {
          const max = Number(issue.maximum)
          return `Port must be less than ${max + 1}`
        }
        return 'Port is too large'
      },
    })

/**
 * Positive integer schema
 */
export const positiveIntegerSchema = (fieldName: string = 'Value') =>
  z
    .number({
      error: (issue) => {
        if (issue.code === 'invalid_type') {
          return `${fieldName} must be a number`
        }
        return `Invalid ${fieldName.toLowerCase()}`
      },
    })
    .int({ error: `${fieldName} must be an integer` })
    .positive({ error: `${fieldName} must be positive` })

// === Date and Time Schemas ===

/**
 * Date validation schema with multiple format support
 */
export const dateSchema = (
  options: {
    allowFuture?: boolean
    allowPast?: boolean
    format?: 'iso' | 'date-only' | 'any'
  } = {}
) => {
  const { allowFuture = true, allowPast = true, format = 'any' } = options
  const now = new Date()

  if (format === 'iso') {
    return z
      .string({
        error: 'Date must be a string',
      })
      .datetime({
        error: 'Date must be in ISO 8601 format',
      })
      .transform((str) => {
        const date = new Date(str)
        if (!allowFuture && date > now) {
          throw new Error('Date cannot be in the future')
        }
        if (!allowPast && date < now) {
          throw new Error('Date cannot be in the past')
        }
        return date
      })
  } else if (format === 'date-only') {
    return z
      .string({
        error: 'Date must be a string',
      })
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        error: 'Date must be in YYYY-MM-DD format',
      })
      .transform((str) => {
        const date = new Date(str + 'T00:00:00.000Z')
        if (!allowFuture && date > now) {
          throw new Error('Date cannot be in the future')
        }
        if (!allowPast && date < now) {
          throw new Error('Date cannot be in the past')
        }
        return date
      })
  } else {
    return z
      .union([z.string().datetime(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.date()])
      .transform((input) => {
        let date: Date
        if (input instanceof Date) {
          date = input
        } else if (typeof input === 'string') {
          if (input.includes('T')) {
            date = new Date(input)
          } else {
            date = new Date(input + 'T00:00:00.000Z')
          }
        } else {
          throw new Error('Invalid date input')
        }

        if (!allowFuture && date > now) {
          throw new Error('Date cannot be in the future')
        }
        if (!allowPast && date < now) {
          throw new Error('Date cannot be in the past')
        }
        return date
      })
  }
}

// === Collection Schemas ===

/**
 * Array validation schema with length constraints
 */
export const arraySchema = <T>(
  itemSchema: z.ZodSchema<T>,
  options: {
    minLength?: number
    maxLength?: number
    unique?: boolean
    fieldName?: string
  } = {}
) => {
  const { minLength, maxLength, unique = false, fieldName = 'Array' } = options

  let schema = z.array(itemSchema)

  if (minLength !== undefined) {
    schema = schema.min(minLength, {
      error: (issue) => {
        if (issue.code === 'too_small') {
          return `${fieldName} must have at least ${issue.minimum} items`
        }
        return `${fieldName} has too few items`
      },
    })
  }

  if (maxLength !== undefined) {
    schema = schema.max(maxLength, {
      error: (issue) => {
        if (issue.code === 'too_big') {
          return `${fieldName} must have no more than ${issue.maximum} items`
        }
        return `${fieldName} has too many items`
      },
    })
  }

  if (unique) {
    return schema.refine((arr) => new Set(arr).size === arr.length, {
      error: `${fieldName} items must be unique`,
    })
  }

  return schema
}

// === Schema Composition Utilities ===

/**
 * Create a schema with optional fields
 */
export const optionalSchema = <T>(schema: z.ZodSchema<T>) => schema.optional()

/**
 * Create a schema with default value
 */
export const withDefault = <T>(schema: z.ZodSchema<T>, defaultValue: T) =>
  schema.default(defaultValue as Exclude<T, undefined>)

/**
 * Merge multiple object schemas
 */
export const mergeSchemas = <T extends z.ZodRawShape, U extends z.ZodRawShape>(
  schemaA: z.ZodObject<T>,
  schemaB: z.ZodObject<U>
) => schemaA.merge(schemaB)

/**
 * Create conditional schema based on another field
 * Note: Simplified implementation to avoid complex TypeScript issues
 */
export const conditionalSchema = <T>(
  conditionField: string,
  conditionValue: any,
  thenSchema: z.ZodSchema<T>,
  elseSchema?: z.ZodSchema<T>
) => {
  const baseSchema = z.object({
    [conditionField]: z.literal(conditionValue),
    value: thenSchema,
  })

  if (elseSchema) {
    const elseSchemaObj = z.object({
      [conditionField]: z.any().refine((val) => val !== conditionValue, {
        error: `Field must not equal ${conditionValue}`,
      }),
      value: elseSchema,
    })

    return z.union([baseSchema, elseSchemaObj])
  }

  return baseSchema
}

// === Validator Factory Functions ===

/**
 * Create a validator function from a schema
 */
export const createSchemaValidator = <T>(
  schema: z.ZodSchema<T>,
  config?: ValidationConfig
): ValidatorFn<unknown, T> => {
  return createValidator(schema, config)
}

/**
 * Common validation presets for frequent use cases
 */
export const validationPresets = {
  // Common string validations
  email: () => createSchemaValidator(emailSchema()),
  url: (requireHttps = false) => createSchemaValidator(urlSchema({ requireHttps })),
  phone: () => createSchemaValidator(phoneSchema()),

  // Project-specific validations
  projectName: () => createSchemaValidator(projectNameSchema()),
  packageManager: () => createSchemaValidator(packageManagerSchema()),
  filePath: (options?: Parameters<typeof filePathSchema>[0]) =>
    createSchemaValidator(filePathSchema(options)),

  // Numeric validations
  port: () => createSchemaValidator(portSchema()),
  positiveInteger: (fieldName?: string) => createSchemaValidator(positiveIntegerSchema(fieldName)),

  // Date validations
  date: (options?: Parameters<typeof dateSchema>[0]) => createSchemaValidator(dateSchema(options)),

  // Collection validations
  array: <T>(itemSchema: z.ZodSchema<T>, options?: Parameters<typeof arraySchema>[1]) =>
    createSchemaValidator(arraySchema(itemSchema, options)),
}

/**
 * Schema registry for dynamic schema lookup
 */
export const schemaRegistry = {
  email: emailSchema,
  url: urlSchema,
  phone: phoneSchema,
  projectName: projectNameSchema,
  packageManager: packageManagerSchema,
  filePath: filePathSchema,
  author: authorSchema,
  port: portSchema,
  positiveInteger: positiveIntegerSchema,
  date: dateSchema,
  array: arraySchema,
  stringLength: stringLengthSchema,
  nonEmptyString: nonEmptyStringSchema,
  trimmedString: trimmedStringSchema,
} as const

export type SchemaRegistryKey = keyof typeof schemaRegistry
