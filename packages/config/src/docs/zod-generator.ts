import { z } from '@esteban-url/validation'
import type { Result } from '@esteban-url/core'
import type { CoreError } from '@esteban-url/core'
import { ok, err, createCoreError } from '@esteban-url/core'
import type { ZodConfigSchema } from '../core/zod-schema.js'

// ========================================
// Enhanced Documentation Types (Zod-Powered)
// ========================================

export interface ZodConfigDocs {
  readonly title: string
  readonly description?: string
  readonly version?: string
  readonly generatedAt: string
  readonly sections: readonly ZodDocumentationSection[]
  readonly metadata: ZodDocsMetadata
  readonly schema: ZodJsonSchema
}

export interface ZodDocumentationSection {
  readonly title: string
  readonly description?: string
  readonly fields: readonly ZodFieldDocumentation[]
  readonly examples?: readonly ZodExampleConfig[]
}

export interface ZodFieldDocumentation {
  readonly name: string
  readonly type: string
  readonly description?: string
  readonly required: boolean
  readonly defaultValue?: unknown
  readonly examples: readonly unknown[]
  readonly constraints?: ZodFieldConstraints
  readonly validation?: ZodValidationInfo
  readonly path: readonly string[]
  readonly zodType: string
}

export interface ZodFieldConstraints {
  readonly enum?: readonly unknown[]
  readonly pattern?: string
  readonly minimum?: number
  readonly maximum?: number
  readonly minLength?: number
  readonly maxLength?: number
  readonly format?: string
  readonly multipleOf?: number
  readonly inclusive?: {
    readonly min?: boolean
    readonly max?: boolean
  }
}

export interface ZodValidationInfo {
  readonly rules: readonly string[]
  readonly errorMessage?: string
  readonly customValidator?: string
  readonly transforms?: readonly string[]
}

export interface ZodExampleConfig {
  readonly title: string
  readonly description?: string
  readonly config: Record<string, unknown>
  readonly valid: boolean
  readonly useCase?: string
  readonly errors?: readonly string[]
}

export interface ZodDocsMetadata {
  readonly fieldCount: number
  readonly requiredFieldCount: number
  readonly optionalFieldCount: number
  readonly nestedObjectCount: number
  readonly arrayFieldCount: number
  readonly enumFieldCount: number
  readonly schemaVersion?: string
  readonly generator: string
  readonly generatorVersion: string
  readonly zodVersion: string
}

export interface ZodDocsGeneratorOptions {
  readonly title?: string
  readonly includeExamples?: boolean
  readonly includeConstraints?: boolean
  readonly includeValidation?: boolean
  readonly includeJsonSchema?: boolean
  readonly format?: 'markdown' | 'json' | 'html'
  readonly template?: string
  readonly outputPath?: string
  readonly maxDepth?: number
}

export interface ZodJsonSchema {
  readonly $schema: string
  readonly type: string
  readonly title?: string
  readonly description?: string
  readonly properties?: Record<string, ZodJsonSchemaProperty>
  readonly required?: readonly string[]
  readonly additionalProperties?: boolean
  readonly definitions?: Record<string, ZodJsonSchemaProperty>
}

export interface ZodJsonSchemaProperty {
  readonly type?: string | readonly string[]
  readonly description?: string
  readonly default?: unknown
  readonly examples?: readonly unknown[]
  readonly enum?: readonly unknown[]
  readonly const?: unknown
  readonly pattern?: string
  readonly format?: string
  readonly minimum?: number
  readonly maximum?: number
  readonly exclusiveMinimum?: number
  readonly exclusiveMaximum?: number
  readonly multipleOf?: number
  readonly minLength?: number
  readonly maxLength?: number
  readonly minItems?: number
  readonly maxItems?: number
  readonly uniqueItems?: boolean
  readonly items?: ZodJsonSchemaProperty
  readonly properties?: Record<string, ZodJsonSchemaProperty>
  readonly additionalProperties?: boolean | ZodJsonSchemaProperty
  readonly required?: readonly string[]
  readonly oneOf?: readonly ZodJsonSchemaProperty[]
  readonly anyOf?: readonly ZodJsonSchemaProperty[]
  readonly allOf?: readonly ZodJsonSchemaProperty[]
  readonly not?: ZodJsonSchemaProperty
  readonly $ref?: string
}

// ========================================
// Enhanced Documentation Generator (Zod-Powered)
// ========================================

export const generateZodConfigDocs = <T>(
  schema: ZodConfigSchema<T>,
  options: ZodDocsGeneratorOptions = {}
): Result<ZodConfigDocs, CoreError> => {
  try {
    const {
      title = schema.name || 'Configuration Documentation',
      includeExamples = true,
      includeConstraints = true,
      includeValidation = true,
      includeJsonSchema = true,
      maxDepth = 10,
    } = options

    // Generate field documentation from Zod schema
    const fieldsResult = generateZodFieldsDocumentation(schema.zodSchema, {
      includeConstraints,
      includeValidation,
      includeExamples,
      maxDepth,
    })

    if (fieldsResult.isErr()) {
      return err(fieldsResult.error)
    }

    const fields = fieldsResult.value

    // Generate examples if requested
    const examples: ZodExampleConfig[] = []
    if (includeExamples) {
      const examplesResult = generateZodExamples(schema)
      if (examplesResult.isOk()) {
        examples.push(...examplesResult.value)
      }
    }

    // Generate JSON Schema if requested
    const jsonSchema = includeJsonSchema
      ? generateZodJsonSchema(schema.zodSchema, schema.name, schema.description)
      : ({
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          type: 'object',
        } as ZodJsonSchema)

    // Create main section
    const sections: ZodDocumentationSection[] = [
      {
        title: 'Configuration Fields',
        description: 'All available configuration options',
        fields,
        examples: examples.length > 0 ? examples : undefined,
      },
    ]

    // Calculate metadata
    const metadata: ZodDocsMetadata = {
      fieldCount: fields.length,
      requiredFieldCount: fields.filter((f) => f.required).length,
      optionalFieldCount: fields.filter((f) => !f.required).length,
      nestedObjectCount: fields.filter((f) => f.type === 'object').length,
      arrayFieldCount: fields.filter((f) => f.type === 'array').length,
      enumFieldCount: fields.filter((f) => f.constraints?.enum).length,
      schemaVersion: schema.version,
      generator: '@esteban-url/config/zod',
      generatorVersion: '2.0.0',
      zodVersion: 'unknown', // z.version is not available
    }

    const docs: ZodConfigDocs = {
      title,
      description: schema.description,
      version: schema.version,
      generatedAt: new Date().toISOString(),
      sections,
      metadata,
      schema: jsonSchema,
    }

    return ok(docs)
  } catch (error) {
    return err(
      createCoreError(
        'ZOD_DOCS_GENERATION_FAILED',
        'DOCS_ERROR',
        'Failed to generate Zod configuration documentation',
        {
          component: 'config',
          operation: 'generate-zod-docs',
          severity: 'medium',
          context: { schema: schema.name },
          cause: error instanceof Error ? error : undefined,
        }
      )
    )
  }
}

// ========================================
// Enhanced Field Documentation Generation
// ========================================

interface ZodFieldDocsOptions {
  readonly includeConstraints: boolean
  readonly includeValidation: boolean
  readonly includeExamples: boolean
  readonly maxDepth: number
}

const generateZodFieldsDocumentation = (
  zodSchema: z.ZodTypeAny,
  options: ZodFieldDocsOptions,
  path: readonly string[] = []
): Result<readonly ZodFieldDocumentation[], CoreError> => {
  try {
    const fields: ZodFieldDocumentation[] = []

    if (path.length > options.maxDepth) {
      return ok(fields)
    }

    // Handle different Zod types
    if (zodSchema instanceof z.ZodObject) {
      const shape = zodSchema.shape

      for (const [fieldName, fieldSchema] of Object.entries(shape)) {
        const fieldPath = [...path, fieldName]
        const fieldDoc = generateZodFieldDocumentation(
          fieldName,
          fieldSchema as z.ZodTypeAny,
          fieldPath,
          options
        )

        if (fieldDoc) {
          fields.push(fieldDoc)
        }

        // Recursively process nested objects
        if (fieldSchema instanceof z.ZodObject && path.length < options.maxDepth) {
          const nestedResult = generateZodFieldsDocumentation(fieldSchema, options, fieldPath)

          if (nestedResult.isOk()) {
            fields.push(...nestedResult.value)
          }
        }
      }
    }

    return ok(fields)
  } catch (error) {
    return err(
      createCoreError(
        'ZOD_FIELD_DOCS_GENERATION_FAILED',
        'FIELD_DOCS_ERROR',
        'Failed to generate Zod field documentation',
        {
          component: 'config',
          operation: 'generate-zod-field-docs',
          severity: 'medium',
          cause: error instanceof Error ? error : undefined,
        }
      )
    )
  }
}

const generateZodFieldDocumentation = (
  fieldName: string,
  fieldSchema: z.ZodTypeAny,
  path: readonly string[],
  options: ZodFieldDocsOptions
): ZodFieldDocumentation | null => {
  try {
    // Unwrap optional and default wrappers
    let unwrapped = fieldSchema
    let isOptional = false
    let defaultValue: unknown = undefined

    while (unwrapped instanceof z.ZodOptional || unwrapped instanceof z.ZodDefault) {
      if (unwrapped instanceof z.ZodOptional) {
        isOptional = true
        unwrapped = unwrapped.unwrap() as z.ZodTypeAny
      }
      if (unwrapped instanceof z.ZodDefault) {
        const def = (unwrapped as any)._def
        defaultValue =
          typeof def.defaultValue === 'function' ? def.defaultValue() : def.defaultValue
        unwrapped = unwrapped.removeDefault() as z.ZodTypeAny
      }
    }

    const zodTypeName = unwrapped.constructor.name
    const type = getZodTypeString(unwrapped)
    const description = (fieldSchema as any).description || (fieldSchema as any)._def?.description
    const examples = (fieldSchema as any)._def?.examples || []

    // Extract constraints
    const constraints = options.includeConstraints ? extractZodConstraints(unwrapped) : undefined

    // Extract validation info
    const validation = options.includeValidation ? extractZodValidationInfo(unwrapped) : undefined

    return {
      name: fieldName,
      type,
      description,
      required: !isOptional,
      defaultValue,
      examples: options.includeExamples ? examples : [],
      constraints,
      validation,
      path,
      zodType: zodTypeName,
    }
  } catch {
    return null
  }
}

// ========================================
// Zod Type Analysis Utilities
// ========================================

const getZodTypeString = (schema: z.ZodTypeAny): string => {
  if (schema instanceof z.ZodString) return 'string'
  if (schema instanceof z.ZodNumber) return 'number'
  if (schema instanceof z.ZodBoolean) return 'boolean'
  if (schema instanceof z.ZodArray) return 'array'
  if (schema instanceof z.ZodObject) return 'object'
  if (schema instanceof z.ZodEnum) return 'enum'
  if (schema instanceof z.ZodLiteral) return 'literal'
  if (schema instanceof z.ZodUnion) return 'union'
  if (schema instanceof z.ZodIntersection) return 'intersection'
  if (schema instanceof z.ZodRecord) return 'record'
  if (schema instanceof z.ZodMap) return 'map'
  if (schema instanceof z.ZodSet) return 'set'
  if (schema instanceof z.ZodDate) return 'date'
  if (schema instanceof z.ZodUndefined) return 'undefined'
  if (schema instanceof z.ZodNull) return 'null'
  if (schema instanceof z.ZodVoid) return 'void'
  if (schema instanceof z.ZodAny) return 'any'
  if (schema instanceof z.ZodUnknown) return 'unknown'
  if (schema instanceof z.ZodNever) return 'never'
  return 'unknown'
}

const extractZodConstraints = (schema: z.ZodTypeAny): ZodFieldConstraints | undefined => {
  const constraints: {
    enum?: unknown[]
    pattern?: string
    minimum?: number
    maximum?: number
    minLength?: number
    maxLength?: number
    format?: string
    multipleOf?: number
    inclusive?: { min?: boolean; max?: boolean }
  } = {}

  // String constraints
  if (schema instanceof z.ZodString) {
    const checks = (schema as any)._def.checks || []

    for (const check of checks) {
      switch (check.kind) {
        case 'min':
          constraints.minLength = check.value
          break
        case 'max':
          constraints.maxLength = check.value
          break
        case 'regex':
          constraints.pattern = check.regex.source
          break
        case 'email':
          constraints.format = 'email'
          break
        case 'url':
          constraints.format = 'url'
          break
        case 'uuid':
          constraints.format = 'uuid'
          break
      }
    }
  }

  // Number constraints
  if (schema instanceof z.ZodNumber) {
    const checks = (schema as any)._def.checks || []

    for (const check of checks) {
      switch (check.kind) {
        case 'min':
          constraints.minimum = check.value
          if (constraints.inclusive) {
            constraints.inclusive.min = check.inclusive
          } else {
            constraints.inclusive = { min: check.inclusive }
          }
          break
        case 'max':
          constraints.maximum = check.value
          if (constraints.inclusive) {
            constraints.inclusive.max = check.inclusive
          } else {
            constraints.inclusive = { max: check.inclusive }
          }
          break
        case 'multipleOf':
          constraints.multipleOf = check.value
          break
      }
    }
  }

  // Enum constraints
  if (schema instanceof z.ZodEnum) {
    constraints.enum = (schema as any)._def.values
  }

  return Object.keys(constraints).length > 0 ? (constraints as ZodFieldConstraints) : undefined
}

const extractZodValidationInfo = (schema: z.ZodTypeAny): ZodValidationInfo | undefined => {
  const rules: string[] = []
  const transforms: string[] = []

  // Analyze schema for validation rules
  if (schema instanceof z.ZodString) {
    const checks = (schema as any)._def.checks || []
    for (const check of checks) {
      rules.push(check.kind)
    }
  }

  if (schema instanceof z.ZodNumber) {
    const checks = (schema as any)._def.checks || []
    for (const check of checks) {
      rules.push(check.kind)
    }
  }

  // Check for transforms
  if ((schema as any)._def.transform) {
    transforms.push('transform')
  }

  return rules.length > 0 || transforms.length > 0 ? { rules, transforms } : undefined
}

// ========================================
// Enhanced Example Generation
// ========================================

const generateZodExamples = <T>(
  schema: ZodConfigSchema<T>
): Result<readonly ZodExampleConfig[], CoreError> => {
  try {
    const examples: ZodExampleConfig[] = []

    // Generate a valid example
    const validExample = generateValidExample(schema.zodSchema)
    if (validExample) {
      examples.push({
        title: 'Valid Configuration',
        description: 'A complete, valid configuration example',
        config: validExample,
        valid: true,
        useCase: 'Production deployment',
      })
    }

    // Generate minimal example
    const minimalExample = generateMinimalExample(schema.zodSchema)
    if (minimalExample) {
      examples.push({
        title: 'Minimal Configuration',
        description: 'Minimal configuration with only required fields',
        config: minimalExample,
        valid: true,
        useCase: 'Development setup',
      })
    }

    return ok(examples)
  } catch (error) {
    return err(
      createCoreError(
        'ZOD_EXAMPLES_GENERATION_FAILED',
        'EXAMPLES_ERROR',
        'Failed to generate Zod examples',
        {
          component: 'config',
          operation: 'generate-zod-examples',
          severity: 'medium',
          cause: error instanceof Error ? error : undefined,
        }
      )
    )
  }
}

const generateValidExample = (schema: z.ZodTypeAny): Record<string, unknown> | null => {
  try {
    if (schema instanceof z.ZodObject) {
      const example: Record<string, unknown> = {}
      const shape = schema.shape

      for (const [key, fieldSchema] of Object.entries(shape)) {
        const fieldExample = generateFieldExample(fieldSchema as z.ZodTypeAny)
        if (fieldExample !== undefined) {
          example[key] = fieldExample
        }
      }

      return example
    }

    return null
  } catch {
    return null
  }
}

const generateMinimalExample = (schema: z.ZodTypeAny): Record<string, unknown> | null => {
  try {
    if (schema instanceof z.ZodObject) {
      const example: Record<string, unknown> = {}
      const shape = schema.shape

      for (const [key, fieldSchema] of Object.entries(shape)) {
        // Only include required fields
        if (!(fieldSchema instanceof z.ZodOptional)) {
          const fieldExample = generateFieldExample(fieldSchema as z.ZodTypeAny)
          if (fieldExample !== undefined) {
            example[key] = fieldExample
          }
        }
      }

      return example
    }

    return null
  } catch {
    return null
  }
}

const generateFieldExample = (schema: z.ZodTypeAny): unknown => {
  // Check for stored examples
  const examples = (schema as any)._def?.examples
  if (examples && examples.length > 0) {
    return examples[0]
  }

  // Check for default value
  if (schema instanceof z.ZodDefault) {
    const def = (schema as any)._def
    return typeof def.defaultValue === 'function' ? def.defaultValue() : def.defaultValue
  }

  // Generate based on type
  if (schema instanceof z.ZodString) return 'example-value'
  if (schema instanceof z.ZodNumber) return 42
  if (schema instanceof z.ZodBoolean) return true
  if (schema instanceof z.ZodArray) return []
  if (schema instanceof z.ZodObject) return {}
  if (schema instanceof z.ZodEnum) {
    const values = (schema as any)._def.values
    return values[0]
  }

  return undefined
}

// ========================================
// Enhanced JSON Schema Generation
// ========================================

export const generateZodJsonSchema = (
  zodSchema: z.ZodTypeAny,
  title?: string,
  description?: string
): ZodJsonSchema => {
  let jsonSchema: ZodJsonSchema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    title,
    description,
  }

  // Check if this is actually a ZodConfigSchema object containing the real zodSchema
  let actualZodSchema = zodSchema
  if (zodSchema && typeof zodSchema === 'object' && 'zodSchema' in zodSchema) {
    actualZodSchema = (zodSchema as any).zodSchema
  }

  // Handle both real Zod objects and serialized/deserialized objects
  const isZodObject =
    actualZodSchema instanceof z.ZodObject ||
    (actualZodSchema as any)._def?.typeName === 'ZodObject'

  if (isZodObject) {
    // Try to get shape from the actual Zod object first, then fallback to _def
    let shape: Record<string, any>

    if (actualZodSchema instanceof z.ZodObject) {
      shape = actualZodSchema.shape
    } else {
      // Handle deserialized Zod objects
      shape = (actualZodSchema as any)._def?.shape || {}
    }

    const properties: Record<string, ZodJsonSchemaProperty> = {}
    const required: string[] = []

    for (const [key, fieldSchema] of Object.entries(shape)) {
      const property = zodSchemaToJsonSchemaProperty(fieldSchema as z.ZodTypeAny)
      properties[key] = property

      // Check if field is required (check both instance and _def for deserialized objects)
      const isOptional =
        fieldSchema instanceof z.ZodOptional ||
        (fieldSchema as any)._def?.typeName === 'ZodOptional'

      if (!isOptional) {
        required.push(key)
      }
    }

    // Check if the original schema was strict (for additionalProperties)
    const isStrict = (zodSchema as any).strict === true

    jsonSchema = {
      ...jsonSchema,
      properties,
      ...(required.length > 0 && { required }),
      ...(isStrict && { additionalProperties: false }),
    }
  }

  return jsonSchema
}

const zodSchemaToJsonSchemaProperty = (schema: z.ZodTypeAny): ZodJsonSchemaProperty => {
  // Handle optional and default wrappers
  if (schema instanceof z.ZodOptional) {
    return zodSchemaToJsonSchemaProperty(schema.unwrap() as z.ZodTypeAny)
  }

  if (schema instanceof z.ZodDefault) {
    const def = (schema as any)._def
    const defaultValue =
      typeof def.defaultValue === 'function' ? def.defaultValue() : def.defaultValue
    const property = zodSchemaToJsonSchemaProperty(schema.removeDefault() as z.ZodTypeAny)
    return {
      ...property,
      default: defaultValue,
    }
  }

  // Handle base types
  if (schema instanceof z.ZodString) {
    const constraints = extractZodConstraints(schema)
    return {
      type: 'string',
      ...(constraints?.pattern && { pattern: constraints.pattern }),
      ...(constraints?.minLength !== undefined && { minLength: constraints.minLength }),
      ...(constraints?.maxLength !== undefined && { maxLength: constraints.maxLength }),
      ...(constraints?.format && { format: constraints.format }),
    }
  }

  if (schema instanceof z.ZodNumber) {
    const constraints = extractZodConstraints(schema)
    return {
      type: 'number',
      ...(constraints?.minimum !== undefined && { minimum: constraints.minimum }),
      ...(constraints?.maximum !== undefined && { maximum: constraints.maximum }),
      ...(constraints?.multipleOf !== undefined && { multipleOf: constraints.multipleOf }),
    }
  }

  if (schema instanceof z.ZodBoolean) {
    return { type: 'boolean' }
  }

  if (schema instanceof z.ZodArray) {
    return {
      type: 'array',
      items: zodSchemaToJsonSchemaProperty(schema.element as z.ZodTypeAny),
    }
  }

  if (schema instanceof z.ZodObject) {
    const properties: Record<string, ZodJsonSchemaProperty> = {}
    const required: string[] = []
    const shape = schema.shape

    for (const [key, fieldSchema] of Object.entries(shape)) {
      properties[key] = zodSchemaToJsonSchemaProperty(fieldSchema as z.ZodTypeAny)
      if (!(fieldSchema instanceof z.ZodOptional)) {
        required.push(key)
      }
    }

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
    }
  }

  if (schema instanceof z.ZodEnum) {
    return {
      type: 'string',
      enum: (schema as any)._def.values,
    }
  }

  return { type: 'unknown' }
}

// ========================================
// Export Types & Functions
// ========================================

// Types are already exported individually above
