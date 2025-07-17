/**
 * @esteban-url/validation/testing
 *
 * Validation testing utilities for schema testing, validation mocking, and assertion helpers.
 * Provides domain-focused utilities for testing validation logic, error handling, and schema composition.
 *
 * @example
 * ```typescript
 * import {
 *   createMockValidator,
 *   validationFixtures,
 *   assertValidationSuccess,
 *   testSchemaComposition,
 * } from '@esteban-url/validation/testing'
 *
 * // Create mock validator
 * const validator = createMockValidator()
 * validator.mockSchema('user', validationFixtures.schemas.user)
 *
 * // Test validation
 * const result = await validator.validate('user', { name: 'Alice', email: 'alice@example.com' })
 * assertValidationSuccess(result, ['name', 'email'])
 * ```
 */

import { ok, err, type Result } from '@esteban-url/core'
import type { CoreError } from '@esteban-url/core'
import { z } from 'zod'

// ========================================
// Enhanced Validation Types and Interfaces
// ========================================

export interface ValidationRule {
  readonly field: string
  readonly type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date' | 'email' | 'url'
  readonly required?: boolean
  readonly min?: number
  readonly max?: number
  readonly pattern?: RegExp
  readonly custom?: (value: any) => boolean | string
  readonly message?: string
}

export interface ValidationSchema {
  readonly id: string
  readonly name: string
  readonly rules: ValidationRule[]
  readonly strict?: boolean
  readonly allowUnknown?: boolean
}

export interface ValidationResult<T = any> {
  readonly success: boolean
  readonly data?: T
  readonly errors: Array<{
    field: string
    message: string
    value: any
    rule: string
  }>
  readonly metadata: {
    readonly validatedFields: string[]
    readonly errorCount: number
    readonly warningCount: number
  }
}

export interface MockValidator {
  readonly registeredSchemas: Map<string, ValidationSchema>
  registerSchema(schema: ValidationSchema): void
  unregisterSchema(schemaId: string): void
  validate<T = any>(schemaId: string, data: any): Result<ValidationResult<T>, CoreError>
  validateWithZod<T>(zodSchema: z.ZodSchema<T>, data: any): Result<ValidationResult<T>, CoreError>
  createCompositeSchema(
    schemaIds: string[],
    composition: 'merge' | 'intersection' | 'union'
  ): Result<ValidationSchema, CoreError>
  mockValidationResult(schemaId: string, data: any, result: ValidationResult): void
  getValidationHistory(): Array<{
    schemaId: string
    data: any
    result: ValidationResult
    timestamp: number
  }>
  clearMocks(): void
}

// ========================================
// Enhanced Mock Validator Creation
// ========================================

/**
 * Creates a comprehensive mock validator for testing
 */
export function createMockValidator(): MockValidator {
  const schemas = new Map<string, ValidationSchema>()
  const validationMocks = new Map<string, ValidationResult>()
  const validationHistory: Array<{
    schemaId: string
    data: any
    result: ValidationResult
    timestamp: number
  }> = []

  return {
    registeredSchemas: schemas,

    registerSchema(schema: ValidationSchema): void {
      schemas.set(schema.id, schema)
    },

    unregisterSchema(schemaId: string): void {
      schemas.delete(schemaId)
    },

    validate<T = any>(schemaId: string, data: any): Result<ValidationResult<T>, CoreError> {
      const timestamp = Date.now()

      // Check for mocked result
      const mockKey = `${schemaId}:${JSON.stringify(data)}`
      const mockedResult = validationMocks.get(mockKey)
      if (mockedResult) {
        validationHistory.push({ schemaId, data, result: mockedResult, timestamp })
        return ok(mockedResult as ValidationResult<T>)
      }

      // Get schema
      const schema = schemas.get(schemaId)
      if (!schema) {
        return err({
          type: 'validation-error' as const,
          domain: 'validation',
          code: 'SCHEMA_NOT_FOUND',
          message: `Validation schema '${schemaId}' not found`,
          timestamp: new Date(),
          recoverable: true,
          component: 'MockValidator',
          operation: 'validate',
          severity: 'high' as const,
        } as CoreError)
      }

      try {
        const errors: Array<{ field: string; message: string; value: any; rule: string }> = []
        const validatedFields: string[] = []
        let validatedData: any = {}

        // Validate each rule
        for (const rule of schema.rules) {
          const value = getValueByPath(data, rule.field)
          validatedFields.push(rule.field)

          // Check required fields
          if (rule.required && (value === undefined || value === null || value === '')) {
            errors.push({
              field: rule.field,
              message: rule.message || `Field '${rule.field}' is required`,
              value,
              rule: 'required',
            })
            continue
          }

          // Skip validation if value is undefined and not required
          if (value === undefined || value === null) {
            continue
          }

          // Type validation
          if (!validateType(value, rule.type)) {
            errors.push({
              field: rule.field,
              message: rule.message || `Field '${rule.field}' must be of type ${rule.type}`,
              value,
              rule: 'type',
            })
            continue
          }

          // Length/range validation
          if (rule.min !== undefined && getLength(value) < rule.min) {
            errors.push({
              field: rule.field,
              message:
                rule.message ||
                `Field '${rule.field}' must be at least ${rule.min} characters/items`,
              value,
              rule: 'min',
            })
          }

          if (rule.max !== undefined && getLength(value) > rule.max) {
            errors.push({
              field: rule.field,
              message:
                rule.message ||
                `Field '${rule.field}' must be at most ${rule.max} characters/items`,
              value,
              rule: 'max',
            })
          }

          // Pattern validation
          if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
            errors.push({
              field: rule.field,
              message: rule.message || `Field '${rule.field}' does not match required pattern`,
              value,
              rule: 'pattern',
            })
          }

          // Custom validation
          if (rule.custom) {
            const customResult = rule.custom(value)
            if (customResult !== true) {
              errors.push({
                field: rule.field,
                message:
                  typeof customResult === 'string'
                    ? customResult
                    : rule.message || `Field '${rule.field}' failed custom validation`,
                value,
                rule: 'custom',
              })
            }
          }

          // Add to validated data if valid
          if (!errors.some((e) => e.field === rule.field)) {
            setValueByPath(validatedData, rule.field, value)
          }
        }

        // Check for unknown fields in strict mode
        if (schema.strict && !schema.allowUnknown) {
          const knownFields = schema.rules.map((r) => r.field)
          const dataFields = getAllFields(data)
          const unknownFields = dataFields.filter((field: string) => !knownFields.includes(field))

          for (const field of unknownFields) {
            errors.push({
              field,
              message: `Unknown field '${field}' not allowed in strict mode`,
              value: getValueByPath(data, field),
              rule: 'unknown',
            })
          }
        }

        const result: ValidationResult<T> = {
          success: errors.length === 0,
          data: errors.length === 0 ? (validatedData as T) : undefined,
          errors,
          metadata: {
            validatedFields,
            errorCount: errors.length,
            warningCount: 0,
          },
        }

        validationHistory.push({ schemaId, data, result, timestamp })
        return ok(result)
      } catch (error) {
        return err({
          type: 'validation-error' as const,
          domain: 'validation',
          code: 'VALIDATION_FAILED',
          message: `Validation failed: ${error}`,
          timestamp: new Date(),
          recoverable: true,
          component: 'MockValidator',
          operation: 'validate',
          severity: 'high' as const,
        } as CoreError)
      }
    },

    validateWithZod<T>(
      zodSchema: z.ZodSchema<T>,
      data: any
    ): Result<ValidationResult<T>, CoreError> {
      try {
        const result = zodSchema.safeParse(data)

        if (result.success) {
          return ok({
            success: true,
            data: result.data,
            errors: [],
            metadata: {
              validatedFields: Object.keys(data || {}),
              errorCount: 0,
              warningCount: 0,
            },
          })
        } else {
          const errors = result.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            value: err.path.reduce((obj, key) => obj?.[key], data),
            rule: err.code,
          }))

          return ok({
            success: false,
            errors,
            metadata: {
              validatedFields: Object.keys(data || {}),
              errorCount: errors.length,
              warningCount: 0,
            },
          })
        }
      } catch (error) {
        return err({
          type: 'validation-error' as const,
          domain: 'validation',
          code: 'ZOD_VALIDATION_FAILED',
          message: `Zod validation failed: ${error}`,
          timestamp: new Date(),
          recoverable: true,
          component: 'MockValidator',
          operation: 'validateWithZod',
          severity: 'high' as const,
        } as CoreError)
      }
    },

    createCompositeSchema(
      schemaIds: string[],
      composition: 'merge' | 'intersection' | 'union'
    ): Result<ValidationSchema, CoreError> {
      const schemasList = schemaIds
        .map((id) => schemas.get(id))
        .filter(Boolean) as ValidationSchema[]

      if (schemasList.length !== schemaIds.length) {
        const missing = schemaIds.filter((id) => !schemas.has(id))
        return err({
          type: 'validation-error' as const,
          domain: 'validation',
          code: 'SCHEMA_NOT_FOUND',
          message: `Cannot create composite schema: schemas not found: ${missing.join(', ')}`,
          timestamp: new Date(),
          recoverable: true,
          component: 'MockValidator',
          operation: 'createCompositeSchema',
          severity: 'high' as const,
        } as CoreError)
      }

      const compositeId = `composite_${composition}_${schemaIds.join('_')}`

      let compositeRules: ValidationRule[]

      switch (composition) {
        case 'merge':
          compositeRules = schemasList.flatMap((schema) => schema.rules)
          break
        case 'intersection':
          compositeRules = schemasList.flatMap((schema) => schema.rules)
          break
        case 'union':
          // For union, we'll take all rules but make them optional (simplified)
          compositeRules = schemasList.flatMap((schema) =>
            schema.rules.map((rule) => ({ ...rule, required: false }))
          )
          break
        default:
          return err({
            type: 'validation-error' as const,
            domain: 'validation',
            code: 'INVALID_COMPOSITION',
            message: `Invalid composition type: ${composition}`,
            timestamp: new Date(),
            recoverable: true,
            component: 'MockValidator',
            operation: 'createCompositeSchema',
            severity: 'high' as const,
          } as CoreError)
      }

      const compositeSchema: ValidationSchema = {
        id: compositeId,
        name: `Composite ${composition} of: ${schemasList.map((s) => s.name).join(', ')}`,
        rules: compositeRules,
        strict: schemasList.some((s) => s.strict),
        allowUnknown: schemasList.every((s) => s.allowUnknown),
      }

      schemas.set(compositeId, compositeSchema)
      return ok(compositeSchema)
    },

    mockValidationResult(schemaId: string, data: any, result: ValidationResult): void {
      const mockKey = `${schemaId}:${JSON.stringify(data)}`
      validationMocks.set(mockKey, result)
    },

    getValidationHistory(): Array<{
      schemaId: string
      data: any
      result: ValidationResult
      timestamp: number
    }> {
      return [...validationHistory]
    },

    clearMocks(): void {
      schemas.clear()
      validationMocks.clear()
      validationHistory.length = 0
    },
  }
}

// Helper functions (moved outside of MockValidator to fix 'this' context issues)
function getValueByPath(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

function setValueByPath(obj: any, path: string, value: any): void {
  const keys = path.split('.')
  const lastKey = keys.pop()!
  const target = keys.reduce((current, key) => {
    if (!(key in current)) current[key] = {}
    return current[key]
  }, obj)
  target[lastKey] = value
}

function getAllFields(obj: any, prefix = ''): string[] {
  const fields: string[] = []
  for (const [key, value] of Object.entries(obj || {})) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    fields.push(fullKey)
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      fields.push(...getAllFields(value, fullKey))
    }
  }
  return fields
}

function validateType(value: any, expectedType: ValidationRule['type']): boolean {
  switch (expectedType) {
    case 'string':
      return typeof value === 'string'
    case 'number':
      return typeof value === 'number' && !isNaN(value)
    case 'boolean':
      return typeof value === 'boolean'
    case 'array':
      return Array.isArray(value)
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value)
    case 'date':
      return value instanceof Date || !isNaN(Date.parse(value))
    case 'email':
      return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    case 'url':
      return typeof value === 'string' && /^https?:\/\/.+/.test(value)
    default:
      return true
  }
}

function getLength(value: any): number {
  if (typeof value === 'string' || Array.isArray(value)) {
    return value.length
  }
  if (typeof value === 'number') {
    return Math.abs(value)
  }
  return 0
}

// ========================================
// Enhanced Validation Test Fixtures
// ========================================

export const validationFixtures = {
  /**
   * Comprehensive validation schemas
   */
  schemas: {
    user: {
      id: 'user',
      name: 'User Schema',
      rules: [
        { field: 'name', type: 'string' as const, required: true, min: 2, max: 50 },
        { field: 'email', type: 'email' as const, required: true },
        { field: 'age', type: 'number' as const, required: false, min: 0, max: 150 },
        {
          field: 'role',
          type: 'string' as const,
          required: false,
          custom: (value: string) => ['user', 'admin', 'moderator'].includes(value),
        },
      ],
      strict: true,
      allowUnknown: false,
    } satisfies ValidationSchema,

    product: {
      id: 'product',
      name: 'Product Schema',
      rules: [
        { field: 'name', type: 'string' as const, required: true, min: 1, max: 100 },
        { field: 'description', type: 'string' as const, required: false, max: 500 },
        { field: 'price', type: 'number' as const, required: true, min: 0 },
        { field: 'category', type: 'string' as const, required: true },
        { field: 'tags', type: 'array' as const, required: false },
        { field: 'inStock', type: 'boolean' as const, required: true },
      ],
      strict: false,
      allowUnknown: true,
    } satisfies ValidationSchema,

    config: {
      id: 'config',
      name: 'Configuration Schema',
      rules: [
        { field: 'app.name', type: 'string' as const, required: true },
        {
          field: 'app.version',
          type: 'string' as const,
          required: true,
          pattern: /^\d+\.\d+\.\d+$/,
        },
        { field: 'database.host', type: 'string' as const, required: true },
        { field: 'database.port', type: 'number' as const, required: false, min: 1, max: 65535 },
        { field: 'server.url', type: 'url' as const, required: false },
      ],
      strict: true,
      allowUnknown: false,
    } satisfies ValidationSchema,
  },

  /**
   * Valid test data
   */
  valid: {
    user: {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      age: 30,
      role: 'admin',
    },

    product: {
      name: 'Laptop',
      description: 'High-performance laptop for professionals',
      price: 999.99,
      category: 'electronics',
      tags: ['computer', 'portable', 'work'],
      inStock: true,
    },

    config: {
      app: {
        name: 'MyApp',
        version: '1.2.3',
      },
      database: {
        host: 'localhost',
        port: 5432,
      },
      server: {
        url: 'https://api.example.com',
      },
    },
  },

  /**
   * Invalid test data
   */
  invalid: {
    user: {
      missingRequired: { age: 25 }, // missing name and email
      invalidEmail: { name: 'Bob', email: 'not-an-email' },
      invalidAge: { name: 'Carol', email: 'carol@example.com', age: -5 },
      invalidRole: { name: 'Dave', email: 'dave@example.com', role: 'superuser' },
      tooShortName: { name: 'A', email: 'short@example.com' },
    },

    product: {
      missingRequired: { description: 'A product' }, // missing name, price, category, inStock
      negativePrice: { name: 'Item', price: -10, category: 'test', inStock: true },
      tooLongName: { name: 'A'.repeat(101), price: 10, category: 'test', inStock: true },
    },

    config: {
      invalidVersion: {
        app: { name: 'TestApp', version: '1.2' }, // invalid version pattern
        database: { host: 'localhost' },
      },
      invalidPort: {
        app: { name: 'TestApp', version: '1.0.0' },
        database: { host: 'localhost', port: 99999 }, // port too high
      },
      invalidUrl: {
        app: { name: 'TestApp', version: '1.0.0' },
        database: { host: 'localhost' },
        server: { url: 'not-a-url' },
      },
    },
  },

  /**
   * Zod schemas for testing
   */
  zodSchemas: {
    user: z.object({
      name: z.string().min(2).max(50),
      email: z.string().email(),
      age: z.number().min(0).max(150).optional(),
      role: z.enum(['user', 'admin', 'moderator']).optional(),
    }),

    product: z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      price: z.number().min(0),
      category: z.string(),
      tags: z.array(z.string()).optional(),
      inStock: z.boolean(),
    }),

    config: z.object({
      app: z.object({
        name: z.string(),
        version: z.string().regex(/^\d+\.\d+\.\d+$/),
      }),
      database: z.object({
        host: z.string(),
        port: z.number().min(1).max(65535).optional(),
      }),
      server: z
        .object({
          url: z.string().url().optional(),
        })
        .optional(),
    }),
  },
}

// ========================================
// Enhanced Validation Testing Assertions
// ========================================

/**
 * Asserts that validation succeeded with expected data
 */
export function assertValidationSuccess<T>(
  result: Result<ValidationResult<T>, CoreError>,
  expectedFields?: string[]
): void {
  if (result.isErr()) {
    throw new Error(`Expected validation to succeed, but got error: ${result.error.message}`)
  }

  const validation = result.value
  if (!validation.success) {
    const errorMessages = validation.errors.map((e) => `${e.field}: ${e.message}`).join(', ')
    throw new Error(`Expected validation to succeed, but got errors: ${errorMessages}`)
  }

  if (expectedFields) {
    for (const field of expectedFields) {
      if (!validation.metadata.validatedFields.includes(field)) {
        throw new Error(`Expected field '${field}' to be validated`)
      }
    }
  }
}

/**
 * Asserts that validation failed with expected errors
 */
export function assertValidationFailure<T>(
  result: Result<ValidationResult<T>, CoreError>,
  expectedErrorFields?: string[]
): void {
  if (result.isErr()) {
    // Validation system error - this might be expected in some cases
    return
  }

  const validation = result.value
  if (validation.success) {
    throw new Error(`Expected validation to fail, but it succeeded`)
  }

  if (expectedErrorFields) {
    for (const field of expectedErrorFields) {
      const hasFieldError = validation.errors.some((e) => e.field === field)
      if (!hasFieldError) {
        throw new Error(`Expected validation error for field '${field}'`)
      }
    }
  }
}

/**
 * Asserts that validation data matches expected values
 */
export function assertValidationData<T>(
  validation: ValidationResult<T>,
  expectedData: Partial<T>
): void {
  if (!validation.success || !validation.data) {
    throw new Error('Cannot check validation data on failed validation')
  }

  for (const [key, expectedValue] of Object.entries(expectedData)) {
    const actualValue = (validation.data as any)[key]
    if (actualValue !== expectedValue) {
      throw new Error(
        `Expected validated data '${key}' to be ${JSON.stringify(expectedValue)}, but got ${JSON.stringify(actualValue)}`
      )
    }
  }
}

/**
 * Asserts that specific validation errors occurred
 */
export function assertValidationErrors<T>(
  validation: ValidationResult<T>,
  expectedErrors: Array<{ field: string; rule?: string }>
): void {
  for (const expectedError of expectedErrors) {
    const matchingError = validation.errors.find(
      (e) =>
        e.field === expectedError.field && (!expectedError.rule || e.rule === expectedError.rule)
    )

    if (!matchingError) {
      throw new Error(
        `Expected validation error for field '${expectedError.field}' with rule '${expectedError.rule || 'any'}'`
      )
    }
  }
}

// ========================================
// Enhanced Validation Testing Utilities
// ========================================

/**
 * Tests schema composition functionality
 */
export function testSchemaComposition(
  validator: MockValidator,
  schemaIds: string[],
  composition: 'merge' | 'intersection' | 'union',
  testData: any
): Result<ValidationResult, CoreError> {
  const compositeResult = validator.createCompositeSchema(schemaIds, composition)
  if (compositeResult.isErr()) {
    return err(compositeResult.error)
  }

  return validator.validate(compositeResult.value.id, testData)
}

/**
 * Tests validation with multiple data sets
 */
export function testValidationBatch<T>(
  validator: MockValidator,
  schemaId: string,
  testCases: Array<{ data: any; shouldPass: boolean; name?: string }>
): Array<{
  name: string
  data: any
  shouldPass: boolean
  actualResult: Result<ValidationResult<T>, CoreError>
  passed: boolean
}> {
  return testCases.map((testCase, index) => {
    const result = validator.validate<T>(schemaId, testCase.data)
    const actualSuccess = result.isOk() && result.value.success

    return {
      name: testCase.name || `Test case ${index + 1}`,
      data: testCase.data,
      shouldPass: testCase.shouldPass,
      actualResult: result,
      passed: actualSuccess === testCase.shouldPass,
    }
  })
}

/**
 * Creates a validation test scenario
 */
export function createValidationTestScenario(
  options: {
    schemas?: ValidationSchema[]
    mockResults?: Array<{ schemaId: string; data: any; result: ValidationResult }>
  } = {}
): {
  validator: MockValidator
  testValidation: <T>(schemaId: string, data: any) => Result<ValidationResult<T>, CoreError>
  testZodValidation: <T>(
    zodSchema: z.ZodSchema<T>,
    data: any
  ) => Result<ValidationResult<T>, CoreError>
  testComposition: (
    schemaIds: string[],
    composition: 'merge' | 'intersection' | 'union',
    data: any
  ) => Result<ValidationResult, CoreError>
  cleanup: () => void
} {
  const validator = createMockValidator()

  // Setup schemas
  if (options.schemas) {
    for (const schema of options.schemas) {
      validator.registerSchema(schema)
    }
  }

  // Setup mock results
  if (options.mockResults) {
    for (const mock of options.mockResults) {
      validator.mockValidationResult(mock.schemaId, mock.data, mock.result)
    }
  }

  return {
    validator,

    testValidation<T>(schemaId: string, data: any): Result<ValidationResult<T>, CoreError> {
      return validator.validate<T>(schemaId, data)
    },

    testZodValidation<T>(
      zodSchema: z.ZodSchema<T>,
      data: any
    ): Result<ValidationResult<T>, CoreError> {
      return validator.validateWithZod(zodSchema, data)
    },

    testComposition(
      schemaIds: string[],
      composition: 'merge' | 'intersection' | 'union',
      data: any
    ): Result<ValidationResult, CoreError> {
      return testSchemaComposition(validator, schemaIds, composition, data)
    },

    cleanup(): void {
      validator.clearMocks()
    },
  }
}

// ========================================
// Export Collections
// ========================================

/**
 * Validation testing utilities grouped by functionality
 */
export const validationTesting = {
  // Validator creation
  createMockValidator,
  createValidationTestScenario,

  // Testing utilities
  testSchemaComposition,
  testValidationBatch,

  // Fixtures and test data
  fixtures: validationFixtures,

  // Assertions
  assertValidationSuccess,
  assertValidationFailure,
  assertValidationData,
  assertValidationErrors,
}
