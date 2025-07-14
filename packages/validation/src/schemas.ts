import { z } from 'zod'
import type { ValidationConfig } from './types.js'
import { createValidator } from './core.js'
import type { ValidatorFn } from './types.js'

/**
 * Reusable schema building blocks to eliminate duplication across packages.
 * These schemas provide consistent validation patterns and error messages.
 */

// === Basic Type Schemas ===

/**
 * Email validation schema with consistent error messaging
 */
export const emailSchema = () =>
  z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(254, 'Email address is too long') // RFC 5321 limit

/**
 * URL validation schema with protocol requirements
 */
export const urlSchema = (options: { requireHttps?: boolean } = {}) => {
  const baseSchema = z.string().url('Please enter a valid URL')

  if (options.requireHttps) {
    return baseSchema.refine((url) => url.startsWith('https://'), 'URL must use HTTPS protocol')
  }

  return baseSchema
}

/**
 * Phone number validation schema with international support
 */
export const phoneSchema = () =>
  z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^[+]?[1-9][\d\s\-()]{7,15}$/, 'Please enter a valid phone number')

// === String Validation Schemas ===

/**
 * String length validation with configurable min/max
 */
export const stringLengthSchema = (min: number = 1, max?: number, fieldName: string = 'Value') => {
  let schema = z.string().min(min, `${fieldName} must be at least ${min} characters`)

  if (max !== undefined) {
    schema = schema.max(max, `${fieldName} must be no more than ${max} characters`)
  }

  return schema
}

/**
 * Non-empty string schema
 */
export const nonEmptyStringSchema = (fieldName: string = 'Value') =>
  z.string().min(1, `${fieldName} cannot be empty`)

/**
 * Trimmed string schema that normalizes whitespace
 */
export const trimmedStringSchema = (fieldName: string = 'Value') =>
  z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, `${fieldName} cannot be empty or only whitespace`)

// === Project and Path Schemas ===

/**
 * Project name validation schema with npm package name rules
 */
export const projectNameSchema = () =>
  z
    .string()
    .min(1, 'Project name is required')
    .max(214, 'Project name is too long')
    .regex(
      /^[a-z0-9][a-z0-9._-]*$/,
      'Project name must start with a letter or number and contain only lowercase letters, numbers, dots, hyphens, and underscores'
    )
    .refine(
      (name) => !name.startsWith('.') && !name.startsWith('_'),
      'Project name cannot start with a dot or underscore'
    )
    .refine(
      (name) => !['node_modules', 'favicon.ico'].includes(name),
      'Project name cannot be a reserved name'
    )

/**
 * Package manager validation schema
 */
export const packageManagerSchema = () =>
  z.enum(['npm', 'yarn', 'pnpm'], {
    errorMap: () => ({ message: 'Package manager must be npm, yarn, or pnpm' }),
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
    .string()
    .min(1, 'File path cannot be empty')
    .refine((path) => allowAbsolute || !path.startsWith('/'), 'Absolute paths are not allowed')
    .refine((path) => allowTraversal || !path.includes('../'), 'Path traversal (..) is not allowed')
    .refine((path) => !path.includes('\0'), 'Path cannot contain null bytes')
    .refine(
      (path) => (baseDir ? path.startsWith(baseDir) : true),
      baseDir ? `Path must be within ${baseDir}` : 'Invalid path'
    )
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
    .number()
    .int('Port must be an integer')
    .min(1, 'Port must be greater than 0')
    .max(65535, 'Port must be less than 65536')

/**
 * Positive integer schema
 */
export const positiveIntegerSchema = (fieldName: string = 'Value') =>
  z.number().int(`${fieldName} must be an integer`).positive(`${fieldName} must be positive`)

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
      .string()
      .datetime()
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
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
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
    schema = schema.min(minLength, `${fieldName} must have at least ${minLength} items`)
  }

  if (maxLength !== undefined) {
    schema = schema.max(maxLength, `${fieldName} must have no more than ${maxLength} items`)
  }

  if (unique) {
    return schema.refine(
      (arr) => new Set(arr).size === arr.length,
      `${fieldName} items must be unique`
    )
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
  schema.default(defaultValue as z.util.noUndefined<T>)

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
      [conditionField]: z.any().refine((val) => val !== conditionValue),
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
