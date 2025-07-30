import { createValidationError as baseCreateValidationError, z } from '@esteban-url/validation'
import type { ValidationError as BaseValidationError } from '@esteban-url/validation'
import { createCoreError, type CoreError } from '@esteban-url/core'

// ========================================
// Enhanced Configuration Validation Errors
// ========================================

export interface ConfigValidationError extends BaseValidationError {
  readonly suggestion: string
  readonly examples: readonly unknown[]
  readonly fixCommand?: string
  readonly learnMoreUrl?: string
  readonly expectedType: string
  readonly path: readonly string[]
  readonly data?: Record<string, unknown>
}

export interface ConfigValidationContext {
  readonly field: string
  readonly value: unknown
  readonly expectedType: string
  readonly suggestion: string
  readonly examples?: readonly unknown[]
  readonly path?: readonly string[]
  readonly rule?: string
  readonly constraints?: Record<string, unknown>
  readonly cause?: Error | CoreError
  readonly fixCommand?: string
  readonly learnMoreUrl?: string
}

// ========================================
// Enhanced Error Factory Functions
// ========================================

export const createConfigValidationError = (
  context: ConfigValidationContext
): ConfigValidationError => {
  const {
    field,
    value,
    expectedType,
    suggestion,
    examples = [],
    path = [],
    rule,
    constraints,
    cause,
    fixCommand,
    learnMoreUrl,
  } = context

  // Create base validation error
  const message = generateErrorMessage({ field, value, expectedType, suggestion, path, rule })
  const baseError = baseCreateValidationError(message, {
    field,
    value,
    constraints: { expectedType, rule },
    cause,
  })

  // Enhance with config-specific features
  return {
    ...baseError,
    code: rule || baseError.code, // Use rule as code if available, otherwise keep base code
    suggestion,
    examples,
    expectedType,
    path,
    data: constraints,
    fixCommand: fixCommand || generateFixCommand(field, rule, examples),
    learnMoreUrl: learnMoreUrl || generateLearnMoreUrl(rule),
  }
}

export const createSchemaValidationError = (
  errors: readonly ConfigValidationError[],
  schemaName?: string
): CoreError => {
  const message = schemaName
    ? `Schema validation failed for "${schemaName}" with ${errors.length} error(s)`
    : `Schema validation failed with ${errors.length} error(s)`

  return createCoreError('SCHEMA_VALIDATION_FAILED', 'SCHEMA_ERROR', message, {
    component: 'config',
    operation: 'schema-validation',
    severity: 'high',
    context: {
      errorCount: errors.length,
      errors: errors, // Store original errors, not serialized
      schemaName,
    },
    recoverable: true,
  })
}

// ========================================
// Error Message Generation
// ========================================

interface MessageContext {
  readonly field: string
  readonly value: unknown
  readonly expectedType: string
  readonly suggestion: string
  readonly path: readonly string[]
  readonly rule?: string
}

const generateErrorMessage = (context: MessageContext): string => {
  const { field, value, expectedType, suggestion, path, rule } = context

  const pathStr = path.length > 0 ? ` at "${path.join('.')}"` : ''
  const valueStr = ` (received: ${serializeValue(value)})`
  const ruleStr = rule ? ` [rule: ${rule}]` : ''

  return `Invalid ${expectedType} for field "${field}"${pathStr}${valueStr}${ruleStr}. ${suggestion}`
}

// ========================================
// Enhanced Configuration Error Factories
// ========================================

export const enhanceZodError = (
  zodError: z.ZodError,
  schemaName?: string,
  schema?: z.ZodSchema
): CoreError => {
  const configErrors = zodError.issues.map((issue) => {
    const field = issue.path.join('.')
    const rule = issue.code

    let suggestion: string
    let examples: readonly unknown[] = []

    // Try to get examples from schema for this field
    if (schema && issue.path.length > 0) {
      try {
        let currentSchema = schema
        for (const pathSegment of issue.path) {
          if (currentSchema instanceof z.ZodObject) {
            const shape = currentSchema.shape
            // Path segments can be symbols, skip those
            if (typeof pathSegment === 'string' || typeof pathSegment === 'number') {
              currentSchema = shape[pathSegment]
            }
          }
        }
        // Check if the final schema has examples in its _def
        if (currentSchema) {
          let schemaToCheck = currentSchema

          // If it's a ZodDefault (field with .default()), check the innerType
          if ((currentSchema as any)._def?.typeName === 'ZodDefault') {
            schemaToCheck = (currentSchema as any)._def.innerType
          }

          if ((schemaToCheck as any)._def?.examples) {
            examples = (schemaToCheck as any)._def.examples
          }
        }
      } catch {
        // If path navigation fails, fall back to default examples
      }
    }

    switch (issue.code) {
      case 'invalid_type':
        suggestion = `Expected ${issue.expected}, received ${(issue as any).received || typeof (issue as any).input}`
        if (examples.length === 0) {
          examples = getTypeExamples(issue.expected)
        }
        break
      case 'too_small':
        if ((issue as any).type === 'string') {
          suggestion = `Must be at least ${issue.minimum} characters`
        } else {
          suggestion = `Must be at least ${issue.minimum}`
        }
        break
      case 'too_big':
        if ((issue as any).type === 'string') {
          suggestion = `Must be at most ${issue.maximum} characters`
        } else {
          suggestion = `Must be at most ${issue.maximum}`
        }
        break
      case 'invalid_value' as any:
        const enumIssue = issue as any
        if (enumIssue.options) {
          suggestion = `Must be one of: ${enumIssue.options.map((v: any) => JSON.stringify(v)).join(', ')}`
          if (examples.length === 0) {
            examples = enumIssue.options
          }
        } else {
          suggestion = 'Invalid value'
        }
        break
      case 'invalid_format':
        // String validation details are in 'validation' property
        const validation = (issue as any).validation || (issue as any).format
        if (validation === 'email') {
          suggestion = 'Must be a valid email address'
          if (examples.length === 0) {
            examples = ['user@example.com', 'admin@company.org']
          }
        } else if (validation === 'url') {
          suggestion = 'Must be a valid URL'
          if (examples.length === 0) {
            examples = ['https://example.com', 'http://localhost:3000']
          }
        } else if (validation === 'datetime') {
          suggestion = 'Must be a valid ISO 8601 datetime'
          if (examples.length === 0) {
            examples = ['2024-01-01T00:00:00Z', new Date().toISOString()]
          }
        } else if (validation === 'uuid') {
          suggestion = 'Must be a valid UUID'
          if (examples.length === 0) {
            examples = ['550e8400-e29b-41d4-a716-446655440000']
          }
        } else {
          suggestion = `Invalid ${validation} format`
        }
        break
      default:
        suggestion = issue.message
    }

    return createConfigValidationError({
      field,
      value: 'input' in issue ? (issue as any).input : undefined,
      expectedType: getExpectedType(issue),
      suggestion,
      examples,
      path: issue.path.map(String),
      rule,
      cause: issue as any,
    })
  })

  return createSchemaValidationError(configErrors, schemaName)
}

export const createMissingFieldError = (
  field: string,
  expectedType: string,
  path: readonly string[] = []
): ConfigValidationError => {
  const examples = getTypeExamples(expectedType)
  const exampleText = examples.length > 0 ? ` (e.g., ${JSON.stringify(examples[0])})` : ''

  return createConfigValidationError({
    field,
    value: undefined,
    expectedType,
    suggestion: `Add required field "${field}" to your configuration${exampleText}`,
    examples,
    path,
    rule: 'required',
  })
}

export const createTypeError = (
  field: string,
  value: unknown,
  expectedType: string,
  path: readonly string[] = []
): ConfigValidationError => {
  const actualType = Array.isArray(value) ? 'array' : typeof value
  const examples = getTypeExamples(expectedType)
  const exampleText = examples.length > 0 ? ` (e.g., ${JSON.stringify(examples[0])})` : ''

  return createConfigValidationError({
    field,
    value,
    expectedType,
    suggestion: `Expected ${expectedType} for field "${field}", received ${actualType}${exampleText}`,
    examples,
    path,
    rule: 'type',
  })
}

export const createEnumError = (
  field: string,
  value: unknown,
  allowedValues: readonly unknown[],
  path: readonly string[] = []
): ConfigValidationError =>
  createConfigValidationError({
    field,
    value,
    expectedType: 'enum',
    suggestion: `Value must be one of: ${allowedValues.map((v) => JSON.stringify(v)).join(', ')}`,
    examples: allowedValues,
    path,
    rule: 'enum',
    constraints: { allowedValues },
  })

export const createRangeError = (
  field: string,
  value: unknown,
  min?: number,
  max?: number,
  path: readonly string[] = []
): ConfigValidationError => {
  let suggestion: string
  if (min !== undefined && max !== undefined) {
    suggestion = `Value must be between ${min} and ${max}`
  } else if (min !== undefined) {
    suggestion = `Value must be at least ${min}`
  } else if (max !== undefined) {
    suggestion = `Value must be at most ${max}`
  } else {
    suggestion = 'Value is out of range'
  }

  return createConfigValidationError({
    field,
    value,
    expectedType: 'number',
    suggestion,
    examples: min !== undefined && max !== undefined ? [min, Math.floor((min + max) / 2), max] : [],
    path,
    rule: 'range',
    constraints: { min, max },
  })
}

export const createLengthError = (
  field: string,
  value: unknown,
  minLength?: number,
  maxLength?: number,
  path: readonly string[] = []
): ConfigValidationError => {
  let suggestion: string
  if (minLength !== undefined && maxLength !== undefined) {
    suggestion = `Length must be between ${minLength} and ${maxLength} characters`
  } else if (minLength !== undefined) {
    suggestion = `Length must be at least ${minLength} characters`
  } else if (maxLength !== undefined) {
    suggestion = `Length must be at most ${maxLength} characters`
  } else {
    suggestion = 'Length is invalid'
  }

  return createConfigValidationError({
    field,
    value,
    expectedType: 'string',
    suggestion,
    examples: [],
    path,
    rule: 'length',
    constraints: { minLength, maxLength },
  })
}

export const createPatternError = (
  field: string,
  value: unknown,
  pattern: string,
  description?: string,
  path: readonly string[] = []
): ConfigValidationError =>
  createConfigValidationError({
    field,
    value,
    expectedType: 'string',
    suggestion: description || `Value must match pattern: ${pattern}`,
    examples: [],
    path,
    rule: 'pattern',
    constraints: { pattern, description },
  })

// ========================================
// Utility Functions
// ========================================

const generateFixCommand = (
  field: string,
  rule?: string,
  examples?: readonly unknown[]
): string => {
  const fieldPath = field

  switch (rule) {
    case 'required':
      return `config set ${fieldPath} <value>`
    case 'type':
      const example = examples?.[0]
      if (example !== undefined) {
        return `config set ${fieldPath} ${JSON.stringify(example)}`
      }
      return `config set ${fieldPath} <value>`
    case 'enum':
      const firstOption = examples?.[0]
      if (firstOption !== undefined) {
        return `config set ${fieldPath} ${JSON.stringify(firstOption)}`
      }
      return `config set ${fieldPath} <value>`
    default:
      return `config set ${fieldPath} <value>`
  }
}

const generateLearnMoreUrl = (rule?: string): string => {
  const baseUrl = 'https://trailhead.dev/config/rules'
  return rule ? `${baseUrl}/${rule}` : baseUrl
}

const getExpectedType = (issue: z.ZodIssue): string => {
  switch (issue.code) {
    case 'invalid_type':
      return (issue as any).expected || 'unknown'
    case 'invalid_value' as any:
      return 'enum'
    case 'too_small':
    case 'too_big':
      // Type information is available in the issue
      const sizeIssue = issue as any
      return sizeIssue.type || sizeIssue.origin || 'value'
    case 'invalid_format':
      const formatIssue = issue as any
      const validation = formatIssue.validation || formatIssue.format
      if (validation === 'datetime') return 'datetime'
      if (validation === 'date') return 'date'
      return 'string'
    case 'invalid_union':
      return 'union'
    case 'custom':
      return 'custom validation'
    default:
      // Handle additional error codes
      const code = issue.code as string
      if (code === 'invalid_date') return 'date'
      if (code === 'invalid_literal') return 'literal'
      if (code === 'invalid_arguments') return 'arguments'
      if (code === 'invalid_return_type') return 'return type'
      return 'unknown'
  }
}

const serializeValue = (value: unknown): string => {
  if (value === undefined) return 'undefined'
  if (value === null) return 'null'
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'function') return '[Function]'
  if (typeof value === 'symbol') return value.toString()
  if (value instanceof Date) return value.toISOString()
  if (value instanceof Error) return `[Error: ${value.message}]`

  try {
    return JSON.stringify(value)
  } catch {
    return '[Circular Reference]'
  }
}

const _serializeValidationError = (error: ConfigValidationError) => ({
  field: error.field,
  value: serializeValue(error.value),
  expectedType: error.expectedType,
  suggestion: error.suggestion,
  path: error.path,
  rule: error.code,
  constraints: error.data,
})

const getTypeExamples = (type: string): readonly unknown[] => {
  switch (type) {
    case 'string':
      return ['example-string', 'hello-world']
    case 'number':
      return [42, 3.14, 0]
    case 'boolean':
      return [true, false]
    case 'array':
      return [[], ['item1', 'item2']]
    case 'object':
      return [{}, { key: 'value' }]
    case 'date':
      return [new Date().toISOString(), '2024-01-01T00:00:00Z']
    case 'enum':
      return ['option1', 'option2']
    case 'literal':
      return ['exact-value']
    case 'union':
      return ['string-value', 123, true]
    default:
      return []
  }
}

// ========================================
// Validation Error Predicates
// ========================================

export const isConfigValidationError = (error: unknown): error is ConfigValidationError => {
  return typeof error === 'object' && error !== null && 'suggestion' in error && 'examples' in error
}

export const isSchemaValidationError = (error: unknown): error is CoreError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    (error as any).type === 'SCHEMA_VALIDATION_FAILED'
  )
}

// Exports
