import { z } from '@trailhead/validation'
import { ok, err, createCoreError, type Result, type CoreError } from '@trailhead/core'
import { enhanceZodError } from '../validation/errors.js'

// ========================================
// Enhanced Zod-Based Schema Types
// ========================================

export type ConfigResult<T> = Result<T, CoreError>

/**
 * Zod-powered configuration schema with metadata and validation options.
 *
 * Provides enhanced schema definition with name, description, versioning,
 * and strict mode configuration for comprehensive configuration management.
 */
export interface ZodConfigSchema<T = Record<string, unknown>> {
  readonly name?: string
  readonly description?: string
  readonly version?: string
  readonly zodSchema: z.ZodSchema<T>
  readonly strict?: boolean
}

// ========================================
// Enhanced Schema Builder API (Zod-Powered)
// ========================================

/**
 * Schema builder interface providing fluent API for configuration schema construction.
 *
 * Allows chaining of metadata and options to build comprehensive configuration schemas
 * with proper documentation and validation rules.
 *
 * @template T - The type of configuration data this schema validates
 */
export interface ZodSchemaBuilder<T> {
  readonly name: (name: string) => ZodSchemaBuilder<T>
  readonly description: (description: string) => ZodSchemaBuilder<T>
  readonly version: (version: string) => ZodSchemaBuilder<T>
  readonly strict: (strict?: boolean) => ZodSchemaBuilder<T>
  readonly build: () => ZodConfigSchema<T>
}

// ========================================
// Enhanced Field Builders (Zod-Powered)
// ========================================

/**
 * String field builder providing fluent API for string configuration fields.
 *
 * Supports validation rules like pattern matching, length constraints,
 * format validation (email, URL, UUID), and string transformations.
 *
 * @example
 * ```typescript
 * const hostField = string()
 *   .description('Server hostname')
 *   .default('localhost')
 *   .pattern(/^[a-zA-Z0-9.-]+$/, 'Invalid hostname format')
 *   .build()
 * ```
 */
export interface ZodStringFieldBuilder {
  readonly description: (description: string) => ZodStringFieldBuilder
  readonly optional: () => ZodStringFieldBuilder
  readonly default: (defaultValue: string) => ZodStringFieldBuilder
  readonly examples: (...examples: string[]) => ZodStringFieldBuilder
  readonly enum: <T extends readonly [string, ...string[]]>(
    ...values: T
  ) => ZodFieldBuilder<T[number]>
  readonly pattern: (pattern: RegExp, message?: string) => ZodStringFieldBuilder
  readonly minLength: (min: number, message?: string) => ZodStringFieldBuilder
  readonly maxLength: (max: number, message?: string) => ZodStringFieldBuilder
  readonly length: (min: number, max: number) => ZodStringFieldBuilder
  readonly email: (message?: string) => ZodStringFieldBuilder
  readonly url: (message?: string) => ZodStringFieldBuilder
  readonly uuid: (message?: string) => ZodStringFieldBuilder
  readonly trim: () => ZodStringFieldBuilder
  readonly toLowerCase: () => ZodStringFieldBuilder
  readonly toUpperCase: () => ZodStringFieldBuilder
  readonly build: () => z.ZodType<string | undefined>
}

/**
 * Number field builder providing fluent API for numeric configuration fields.
 *
 * Supports validation rules like min/max values, integer constraints,
 * positive/negative checks, and mathematical validations.
 *
 * @example
 * ```typescript
 * const portField = number()
 *   .description('Server port')
 *   .min(1, 'Port must be positive')
 *   .max(65535, 'Port must be valid')
 *   .default(3000)
 *   .build()
 * ```
 */
export interface ZodNumberFieldBuilder {
  readonly description: (description: string) => ZodNumberFieldBuilder
  readonly optional: () => ZodNumberFieldBuilder
  readonly default: (defaultValue: number) => ZodNumberFieldBuilder
  readonly examples: (...examples: number[]) => ZodNumberFieldBuilder
  readonly enum: <T extends readonly [number, ...number[]]>(
    ...values: T
  ) => ZodFieldBuilder<T[number]>
  readonly min: (min: number, message?: string) => ZodNumberFieldBuilder
  readonly max: (max: number, message?: string) => ZodNumberFieldBuilder
  readonly range: (min: number, max: number) => ZodNumberFieldBuilder
  readonly int: (message?: string) => ZodNumberFieldBuilder
  readonly positive: (message?: string) => ZodNumberFieldBuilder
  readonly negative: (message?: string) => ZodNumberFieldBuilder
  readonly nonNegative: (message?: string) => ZodNumberFieldBuilder
  readonly nonPositive: (message?: string) => ZodNumberFieldBuilder
  readonly finite: (message?: string) => ZodNumberFieldBuilder
  readonly multipleOf: (divisor: number, message?: string) => ZodNumberFieldBuilder
  readonly build: () => z.ZodType<number | undefined>
}

/**
 * Boolean field builder providing fluent API for boolean configuration fields.
 *
 * Supports optional flags, default values, and examples for documentation.
 */
export interface ZodBooleanFieldBuilder {
  readonly description: (description: string) => ZodBooleanFieldBuilder
  readonly optional: () => ZodBooleanFieldBuilder
  readonly default: (defaultValue: boolean) => ZodBooleanFieldBuilder
  readonly examples: (...examples: boolean[]) => ZodBooleanFieldBuilder
  readonly build: () => z.ZodType<boolean | undefined>
}

/**
 * Array field builder providing fluent API for array configuration fields.
 *
 * Supports length constraints, item validation, and array-specific validations
 * like non-empty requirements.
 *
 * @template T - The type of items in the array
 */
export interface ZodArrayFieldBuilder<T> {
  readonly description: (description: string) => ZodArrayFieldBuilder<T>
  readonly optional: () => ZodArrayFieldBuilder<T>
  readonly default: (defaultValue: T[]) => ZodArrayFieldBuilder<T>
  readonly examples: (...examples: T[][]) => ZodArrayFieldBuilder<T>
  readonly minLength: (min: number, message?: string) => ZodArrayFieldBuilder<T>
  readonly maxLength: (max: number, message?: string) => ZodArrayFieldBuilder<T>
  readonly length: (length: number, message?: string) => ZodArrayFieldBuilder<T>
  readonly nonempty: (message?: string) => ZodArrayFieldBuilder<T>
  readonly build: () => z.ZodType<T[] | undefined>
}

/**
 * Object field builder providing fluent API for object configuration fields.
 *
 * Supports nested object validation with strict mode, passthrough,
 * and strip options for handling unknown properties.
 *
 * @template T - The type of the object structure
 */
export interface ZodObjectFieldBuilder<T> {
  readonly description: (description: string) => ZodObjectFieldBuilder<T>
  readonly optional: () => ZodObjectFieldBuilder<T>
  readonly default: (defaultValue: T) => ZodObjectFieldBuilder<T>
  readonly examples: (...examples: T[]) => ZodObjectFieldBuilder<T>
  readonly strict: () => ZodObjectFieldBuilder<T>
  readonly passthrough: () => ZodObjectFieldBuilder<T>
  readonly strip: () => ZodObjectFieldBuilder<T>
  readonly build: () => z.ZodType<T | undefined>
}

/**
 * Generic field builder interface for all configuration field types.
 *
 * Provides common functionality like descriptions, optional flags,
 * default values, and examples that apply to all field types.
 *
 * @template T - The type of value this field validates
 */
export interface ZodFieldBuilder<T> {
  readonly description: (description: string) => ZodFieldBuilder<T>
  readonly optional: () => ZodFieldBuilder<T>
  readonly default: (defaultValue: T) => ZodFieldBuilder<T>
  readonly examples: (...examples: T[]) => ZodFieldBuilder<T>
  readonly build: () => z.ZodType<T | undefined>
}

// ========================================
// Enhanced Schema Definition API
// ========================================

/**
 * Defines a Zod-powered configuration schema with type safety and validation.
 *
 * Creates a schema definition API that allows building complex configuration
 * schemas with proper type inference and validation rules.
 *
 * @returns Schema definition object with object builder
 *
 * @example
 * ```typescript
 * const schema = defineZodConfigSchema().object({
 *   port: number().min(1).max(65535).default(3000),
 *   host: string().default('localhost'),
 *   debug: boolean().default(false)
 * })
 * ```
 */
export const defineZodConfigSchema = <_T extends Record<string, unknown>>() => ({
  object: <K extends Record<string, any>>(shape: K) => {
    // Build any builder objects in the shape
    const builtShape: Record<string, any> = {}
    for (const [key, value] of Object.entries(shape)) {
      if (value && typeof value === 'object' && typeof value.build === 'function') {
        builtShape[key] = value.build()
      } else {
        builtShape[key] = value
      }
    }
    return createZodSchemaBuilder<z.infer<z.ZodObject<any>>>(z.object(builtShape))
  },
})

/**
 * Creates a schema builder for fluent configuration schema construction.
 *
 * Provides a chainable API for building configuration schemas with metadata,
 * validation options, and proper type safety.
 *
 * @param zodSchema - Base Zod schema to build upon
 * @returns Schema builder with fluent API
 *
 * @example
 * ```typescript
 * const schema = createZodSchemaBuilder(z.object({ port: z.number() }))
 *   .name('server-config')
 *   .description('Server configuration schema')
 *   .version('1.0.0')
 *   .strict()
 *   .build()
 * ```
 */
export const createZodSchemaBuilder = <T>(zodSchema: z.ZodSchema<T>): ZodSchemaBuilder<T> => {
  let schemaName: string | undefined
  let schemaDescription: string | undefined
  let schemaVersion: string | undefined
  let schemaStrict = false

  const builder: ZodSchemaBuilder<T> = {
    name: (name: string) => {
      schemaName = name
      return builder
    },

    description: (description: string) => {
      schemaDescription = description
      return builder
    },

    version: (version: string) => {
      schemaVersion = version
      return builder
    },

    strict: (strict = true) => {
      schemaStrict = strict
      return builder
    },

    build: (): ZodConfigSchema<T> => ({
      name: schemaName,
      description: schemaDescription,
      version: schemaVersion,
      zodSchema,
      strict: schemaStrict,
    }),
  }

  return builder
}

// ========================================
// Enhanced Field Definition API (Zod-Powered)
// ========================================

/**
 * Creates a string field builder for configuration schemas.
 *
 * Provides a fluent API for building string configuration fields with
 * validation rules, format checking, and transformations.
 *
 * @returns String field builder with validation methods
 *
 * @example
 * ```typescript
 * const apiKeyField = zodString()
 *   .description('API authentication key')
 *   .minLength(32, 'API key must be at least 32 characters')
 *   .pattern(/^[a-zA-Z0-9]+$/, 'API key must be alphanumeric')
 *   .build()
 * ```
 */
export const zodString = (): ZodStringFieldBuilder => {
  let baseSchema = z.string()
  let isOptional = false
  let defaultValue: string | undefined = undefined

  const builder: ZodStringFieldBuilder = {
    description: (description: string) => {
      baseSchema = baseSchema.describe(description)
      return builder
    },

    optional: () => {
      isOptional = true
      return builder
    },

    default: (value: string) => {
      defaultValue = value
      return builder
    },

    examples: (...examples: string[]) => {
      // Store examples as metadata - Zod doesn't have native examples support
      ;(baseSchema as any)._def.examples = examples
      return builder
    },

    enum: <T extends readonly [string, ...string[]]>(...values: T) => {
      let enumSchema: any = z.enum(values)
      const enumBuilder = {
        description: (description: string) => {
          enumSchema = enumSchema.describe(description)
          return enumBuilder
        },
        optional: () => {
          enumSchema = enumSchema.optional()
          return enumBuilder as any
        },
        default: (defaultValue: T[number]) => {
          enumSchema = enumSchema.default(defaultValue)
          return enumBuilder as any
        },
        examples: (...examples: T[number][]) => {
          ;(enumSchema as any)._def.examples = examples
          return enumBuilder
        },
        build: () => enumSchema,
      } as ZodFieldBuilder<T[number]>
      return enumBuilder
    },

    pattern: (pattern: RegExp, message?: string) => {
      baseSchema = baseSchema.regex(pattern, message)
      return builder
    },

    minLength: (min: number, message?: string) => {
      baseSchema = baseSchema.min(min, message)
      return builder
    },

    maxLength: (max: number, message?: string) => {
      baseSchema = baseSchema.max(max, message)
      return builder
    },

    length: (min: number, max: number) => {
      baseSchema = baseSchema.min(min).max(max)
      return builder
    },

    email: (message?: string) => {
      baseSchema = baseSchema.email(message)
      return builder
    },

    url: (message?: string) => {
      baseSchema = baseSchema.url(message)
      return builder
    },

    uuid: (message?: string) => {
      baseSchema = baseSchema.uuid(message)
      return builder
    },

    trim: () => {
      baseSchema = baseSchema.trim()
      return builder
    },

    toLowerCase: () => {
      baseSchema = baseSchema.toLowerCase()
      return builder
    },

    toUpperCase: () => {
      baseSchema = baseSchema.toUpperCase()
      return builder
    },

    build: () => {
      if (defaultValue !== undefined) {
        return baseSchema.default(defaultValue)
      } else if (isOptional) {
        return baseSchema.optional()
      }
      return baseSchema
    },
  }

  return builder
}

/**
 * Creates a number field builder for configuration schemas.
 *
 * Provides a fluent API for building numeric configuration fields with
 * range validation, type constraints, and mathematical validations.
 *
 * @returns Number field builder with validation methods
 *
 * @example
 * ```typescript
 * const timeoutField = zodNumber()
 *   .description('Request timeout in milliseconds')
 *   .min(100, 'Timeout must be at least 100ms')
 *   .max(30000, 'Timeout cannot exceed 30 seconds')
 *   .int('Timeout must be a whole number')
 *   .default(5000)
 *   .build()
 * ```
 */
export const zodNumber = (): ZodNumberFieldBuilder => {
  let baseSchema = z.number()
  let isOptional = false
  let defaultValue: number | undefined = undefined

  const builder: ZodNumberFieldBuilder = {
    description: (description: string) => {
      baseSchema = baseSchema.describe(description)
      return builder
    },

    optional: () => {
      isOptional = true
      return builder
    },

    default: (value: number) => {
      defaultValue = value
      return builder
    },

    examples: (...examples: number[]) => {
      ;(baseSchema as any)._def.examples = examples
      return builder
    },

    enum: <T extends readonly [number, ...number[]]>(...values: T) => {
      let enumSchema: any = z.enum(values as any)
      const enumBuilder = {
        description: (description: string) => {
          enumSchema = enumSchema.describe(description)
          return enumBuilder
        },
        optional: () => {
          enumSchema = enumSchema.optional()
          return enumBuilder as any
        },
        default: (defaultValue: T[number]) => {
          enumSchema = enumSchema.default(defaultValue)
          return enumBuilder as any
        },
        examples: (...examples: T[number][]) => {
          ;(enumSchema as any)._def.examples = examples
          return enumBuilder
        },
        build: () => enumSchema,
      } as ZodFieldBuilder<T[number]>
      return enumBuilder
    },

    min: (min: number, message?: string) => {
      baseSchema = baseSchema.min(min, message)
      return builder
    },

    max: (max: number, message?: string) => {
      baseSchema = baseSchema.max(max, message)
      return builder
    },

    range: (min: number, max: number) => {
      baseSchema = baseSchema.min(min).max(max)
      return builder
    },

    int: (message?: string) => {
      baseSchema = baseSchema.int(message)
      return builder
    },

    positive: (message?: string) => {
      baseSchema = baseSchema.positive(message)
      return builder
    },

    negative: (message?: string) => {
      baseSchema = baseSchema.negative(message)
      return builder
    },

    nonNegative: (message?: string) => {
      baseSchema = baseSchema.nonnegative(message)
      return builder
    },

    nonPositive: (message?: string) => {
      baseSchema = baseSchema.nonpositive(message)
      return builder
    },

    finite: (message?: string) => {
      baseSchema = baseSchema.finite(message)
      return builder
    },

    multipleOf: (divisor: number, message?: string) => {
      baseSchema = baseSchema.multipleOf(divisor, message)
      return builder
    },

    build: () => {
      if (defaultValue !== undefined) {
        return baseSchema.default(defaultValue)
      } else if (isOptional) {
        return baseSchema.optional()
      }
      return baseSchema
    },
  }

  return builder
}

/**
 * Creates a boolean field builder for configuration schemas.
 *
 * Provides a fluent API for building boolean configuration fields with
 * optional flags, default values, and documentation examples.
 *
 * @returns Boolean field builder with validation methods
 *
 * @example
 * ```typescript
 * const debugField = zodBoolean()
 *   .description('Enable debug logging')
 *   .default(false)
 *   .examples(true, false)
 *   .build()
 * ```
 */
export const zodBoolean = (): ZodBooleanFieldBuilder => {
  let baseSchema = z.boolean()
  let isOptional = false
  let defaultValue: boolean | undefined = undefined

  const builder: ZodBooleanFieldBuilder = {
    description: (description: string) => {
      baseSchema = baseSchema.describe(description)
      return builder
    },

    optional: () => {
      isOptional = true
      return builder
    },

    default: (value: boolean) => {
      defaultValue = value
      return builder
    },

    examples: (...examples: boolean[]) => {
      ;(baseSchema as any)._def.examples = examples
      return builder
    },

    build: () => {
      if (defaultValue !== undefined) {
        return baseSchema.default(defaultValue)
      } else if (isOptional) {
        return baseSchema.optional()
      }
      return baseSchema
    },
  }

  return builder
}

/**
 * Creates an array field builder for configuration schemas.
 *
 * Provides a fluent API for building array configuration fields with
 * length constraints, item validation, and array-specific validations.
 *
 * @param elementSchema - Zod schema for validating array elements
 * @returns Array field builder with validation methods
 *
 * @example
 * ```typescript
 * const tagsField = zodArray(z.string())
 *   .description('Configuration tags')
 *   .minLength(1, 'At least one tag required')
 *   .maxLength(10, 'Maximum 10 tags allowed')
 *   .default(['prod'])
 *   .build()
 * ```
 */
export const zodArray = <T>(elementSchema: z.ZodType<T>): ZodArrayFieldBuilder<T> => {
  let baseSchema: z.ZodArray<z.ZodType<T>> = z.array(elementSchema)
  let isOptional = false
  let defaultValue: T[] | undefined = undefined

  const builder: ZodArrayFieldBuilder<T> = {
    description: (description: string) => {
      baseSchema = baseSchema.describe(description)
      return builder
    },

    optional: () => {
      isOptional = true
      return builder
    },

    default: (value: T[]) => {
      defaultValue = value
      return builder
    },

    examples: (...examples: T[][]) => {
      ;(baseSchema as any)._def.examples = examples
      return builder
    },

    minLength: (min: number, message?: string) => {
      baseSchema = baseSchema.min(min, message)
      return builder
    },

    maxLength: (max: number, message?: string) => {
      baseSchema = baseSchema.max(max, message)
      return builder
    },

    length: (length: number, message?: string) => {
      baseSchema = baseSchema.length(length, message)
      return builder
    },

    nonempty: (message?: string) => {
      baseSchema = baseSchema.nonempty(message) as any // Type assertion needed as nonempty changes cardinality
      return builder
    },

    build: () => {
      if (defaultValue !== undefined) {
        return baseSchema.default(defaultValue)
      } else if (isOptional) {
        return baseSchema.optional()
      }
      return baseSchema
    },
  }

  return builder
}

/**
 * Creates an object field builder for configuration schemas.
 *
 * Provides a fluent API for building object configuration fields with
 * nested validation, strict mode options, and property handling controls.
 *
 * @param shape - Object shape definition with field builders or Zod schemas
 * @returns Object field builder with validation methods
 *
 * @example
 * ```typescript
 * const serverConfigField = zodObject({
 *   host: string().default('localhost'),
 *   port: number().min(1).max(65535).default(3000),
 *   ssl: boolean().default(false)
 * })
 *   .description('Server configuration object')
 *   .strict()
 *   .build()
 * ```
 */
export const zodObject = <T extends Record<string, any>>(shape: T): ZodObjectFieldBuilder<any> => {
  // Build any builder objects in the shape
  const builtShape: Record<string, any> = {}
  for (const [key, value] of Object.entries(shape)) {
    if (value && typeof value === 'object' && typeof value.build === 'function') {
      builtShape[key] = value.build()
    } else {
      builtShape[key] = value
    }
  }

  let baseSchema: z.ZodObject<any> = z.object(builtShape)
  let isOptional = false
  let defaultValue: any | undefined = undefined

  const builder: ZodObjectFieldBuilder<any> = {
    description: (description: string) => {
      baseSchema = baseSchema.describe(description)
      return builder
    },

    optional: () => {
      isOptional = true
      return builder
    },

    default: (value: any) => {
      defaultValue = value
      return builder
    },

    examples: (...examples: any[]) => {
      ;(baseSchema as any)._def.examples = examples
      return builder
    },

    strict: () => {
      baseSchema = baseSchema.strict() as any // Type assertion needed as strict changes catch mode
      return builder
    },

    passthrough: () => {
      baseSchema = baseSchema.passthrough() as any // Type assertion needed as passthrough changes catch mode
      return builder
    },

    strip: () => {
      baseSchema = baseSchema.strip() as any // Type assertion needed for consistency
      return builder
    },

    build: () => {
      if (defaultValue !== undefined) {
        return baseSchema.default(defaultValue) as any
      } else if (isOptional) {
        return baseSchema.optional() as any
      }
      return baseSchema as any
    },
  }

  return builder as any
}

// ========================================
// Enhanced Schema Validation (Zod-Powered)
// ========================================

/**
 * Validates configuration data against a Zod schema synchronously.
 *
 * Provides comprehensive validation with enhanced error reporting
 * and proper type inference from the schema.
 *
 * @param data - Configuration data to validate
 * @param schema - Zod configuration schema to validate against
 * @returns Result with validated data or detailed validation errors
 *
 * @example
 * ```typescript
 * const result = validateWithZodSchema(configData, serverSchema)
 * if (result.isOk()) {
 *   console.log('Valid config:', result.value)
 * } else {
 *   console.error('Validation failed:', result.error)
 * }
 * ```
 */
export const validateWithZodSchema = <T>(
  data: unknown,
  schema: ZodConfigSchema<T>
): ConfigResult<T> => {
  try {
    const result = schema.zodSchema.parse(data)
    return ok(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const enhancedError = enhanceZodError(error, schema.name, schema.zodSchema)
      return err(enhancedError)
    }

    // Handle unexpected errors
    return err(
      createCoreError(
        'VALIDATION_FAILED',
        'VALIDATION_ERROR',
        'Validation failed due to unexpected error',
        {
          component: 'config',
          operation: 'schema-validation',
          severity: 'high',
          cause: error instanceof Error ? error : undefined,
        }
      )
    )
  }
}

/**
 * Validates configuration data against a Zod schema asynchronously.
 *
 * Provides comprehensive async validation with enhanced error reporting
 * for schemas that include async refinements or transformations.
 *
 * @param data - Configuration data to validate
 * @param schema - Zod configuration schema to validate against
 * @returns Promise resolving to Result with validated data or detailed validation errors
 */
export const validateWithZodSchemaAsync = async <T>(
  data: unknown,
  schema: ZodConfigSchema<T>
): Promise<ConfigResult<T>> => {
  try {
    const result = await schema.zodSchema.parseAsync(data)
    return ok(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const enhancedError = enhanceZodError(error, schema.name, schema.zodSchema)
      return err(enhancedError)
    }

    return err(
      createCoreError(
        'VALIDATION_FAILED',
        'ASYNC_VALIDATION_ERROR',
        'Async validation failed due to unexpected error',
        {
          component: 'config',
          operation: 'async-schema-validation',
          severity: 'high',
          cause: error instanceof Error ? error : undefined,
        }
      )
    )
  }
}

// ========================================
// Convenience Functions
// ========================================

/**
 * Creates a Zod schema builder from an object shape definition.
 *
 * Convenience function for quickly creating configuration schemas
 * from object definitions with proper type inference.
 *
 * @param shape - Object shape with Zod schema definitions
 * @returns Schema builder for fluent configuration
 *
 * @example
 * ```typescript
 * const schema = createZodSchema({
 *   port: z.number().min(1).max(65535),
 *   host: z.string().default('localhost')
 * }).name('server-config').build()
 * ```
 */
export const createZodSchema = <T extends z.ZodRawShape>(shape: T) =>
  createZodSchemaBuilder(z.object(shape))

/**
 * Direct exports for common schema builders providing convenient access.
 *
 * These are aliases to the main builder functions for easier imports
 * and more concise schema definitions.
 */
export const string = zodString
export const number = zodNumber
export const boolean = zodBoolean
export const array = zodArray
export const object = zodObject

/**
 * Configuration validator type for custom validation logic.
 *
 * Provides a standard interface for implementing custom validators
 * that can be registered with the validator operations system.
 */
export type ConfigValidator<T> = {
  readonly name: string
  readonly schema: ZodConfigSchema<T>
  readonly validate: (config: unknown) => Promise<Result<T, CoreError>>
}

/**
 * Validates configuration using safe parsing with comprehensive error handling.
 *
 * Provides a simpler validation API using Zod's safe parsing for better
 * error handling and type safety without throwing exceptions.
 *
 * @param config - Configuration data to validate
 * @param schema - Zod configuration schema
 * @returns Result with validated data or enhanced validation errors
 */
export const validate = <T>(config: unknown, schema: ZodConfigSchema<T>): Result<T, CoreError> => {
  try {
    const result = schema.zodSchema.safeParse(config)
    if (result.success) {
      return ok(result.data)
    } else {
      return err(enhanceZodError(result.error, schema.name))
    }
  } catch (error) {
    return err(
      createCoreError('VALIDATION_ERROR', 'SCHEMA_ERROR', 'Validation failed', {
        component: 'config',
        operation: 'validation',
        severity: 'medium',
        cause: error instanceof Error ? error : undefined,
      })
    )
  }
}
