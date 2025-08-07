// ========================================
// Main Configuration Package Exports
// ========================================

/**
 * Creates configuration operations for managing application configuration.
 *
 * Provides a comprehensive API for loading, validating, and watching configuration
 * from multiple sources with proper error handling and type safety.
 *
 * @returns Configuration operations interface with create, load, watch, validate, and transform methods
 *
 * @example
 * ```typescript
 * const ops = createConfigOperations()
 * const manager = ops.create({
 *   name: 'app-config',
 *   sources: [{ type: 'file', path: 'config.json', priority: 1 }]
 * })
 * ```
 *
 * @see {@link ConfigOperations} - Operations interface definition
 * @see {@link createConfigManager} - For direct manager creation
 */
export { createConfigOperations } from './core/operations.js'

/**
 * Creates a configuration manager for a specific configuration definition.
 *
 * The manager provides methods for loading, watching, validating, and accessing
 * configuration values with automatic change detection and error handling.
 *
 * @param definition - Configuration definition with sources, schema, and validators
 * @param deps - Dependencies including loader, validator, and transformer operations
 * @returns Configuration manager instance
 *
 * @example
 * ```typescript
 * const manager = createConfigManager({
 *   name: 'database-config',
 *   sources: [
 *     { type: 'env', env: 'DB_', priority: 1 },
 *     { type: 'file', path: 'db.json', priority: 2, optional: true }
 *   ]
 * }, deps)
 *
 * const state = await manager.load()
 * const host = manager.get('host')
 * ```
 *
 * @see {@link ConfigManager} - Manager interface definition
 * @see {@link ConfigDefinition} - Definition structure
 */
export { createConfigManager } from './core/manager.js'

/**
 * Defines a Zod-powered configuration schema with validation and type safety.
 *
 * Creates a configuration schema that can be used for runtime validation,
 * type inference, and documentation generation.
 *
 * @param schema - Zod schema definition
 * @returns Configuration schema object
 *
 * @example
 * ```typescript
 * const schema = defineSchema(z.object({
 *   port: z.number().min(1).max(65535),
 *   host: z.string().default('localhost')
 * }))
 * ```
 */
export { defineSchema } from './core/index.js'

/**
 * Creates a schema builder for fluent configuration schema construction.
 *
 * Provides a chainable API for building complex configuration schemas
 * with validation, defaults, and documentation.
 *
 * @param zodSchema - Base Zod schema to build upon
 * @returns Schema builder with fluent API
 *
 * @example
 * ```typescript
 * const schema = createSchema(z.object({ port: z.number() }))
 *   .name('server-config')
 *   .description('Server configuration schema')
 *   .version('1.0.0')
 *   .build()
 * ```
 */
export { createSchema } from './core/index.js'

/**
 * Validates configuration data against a Zod schema synchronously.
 *
 * @param data - Configuration data to validate
 * @param schema - Zod schema to validate against
 * @returns Result with validated data or validation error
 *
 * @example
 * ```typescript
 * const result = validate({ port: 3000 }, schema)
 * if (result.isOk()) {
 *   console.log('Valid config:', result.value)
 * }
 * ```
 */
export { validate } from './core/index.js'

/**
 * Validates configuration data against a Zod schema asynchronously.
 *
 * @param data - Configuration data to validate
 * @param schema - Zod schema to validate against
 * @returns Promise resolving to Result with validated data or validation error
 */
export { validateAsync } from './core/index.js'

/**
 * Creates a Zod schema from configuration schema definition.
 *
 * @param config - Configuration schema definition
 * @returns Zod schema instance
 */
export { createZodSchema } from './core/index.js'

/**
 * Creates a string field builder for configuration schemas.
 *
 * @returns String field builder with validation methods
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
export { string } from './core/index.js'

/**
 * Creates a number field builder for configuration schemas.
 *
 * @returns Number field builder with validation methods
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
export { number } from './core/index.js'

/**
 * Creates a boolean field builder for configuration schemas.
 *
 * @returns Boolean field builder with validation methods
 */
export { boolean } from './core/index.js'

/**
 * Creates an array field builder for configuration schemas.
 *
 * @param itemSchema - Schema for array items
 * @returns Array field builder with validation methods
 */
export { array } from './core/index.js'

/**
 * Creates an object field builder for configuration schemas.
 *
 * @param properties - Object property schemas
 * @returns Object field builder with validation methods
 */
export { object } from './core/index.js'

export type {
  ConfigSchema,
  SchemaBuilder,
  StringFieldBuilder,
  NumberFieldBuilder,
  BooleanFieldBuilder,
  ArrayFieldBuilder,
  ObjectFieldBuilder,
  FieldBuilder,
} from './core/index.js'

/**
 * Generates comprehensive documentation from Zod configuration schemas.
 *
 * Creates human-readable documentation with field descriptions, validation rules,
 * examples, and default values for configuration schemas.
 *
 * @param schema - Zod configuration schema
 * @param options - Documentation generation options
 * @returns Generated documentation object
 *
 * @example
 * ```typescript
 * const docs = generateDocs(serverSchema, {
 *   title: 'Server Configuration',
 *   includeExamples: true
 * })
 * console.log(docs.markdown) // Markdown documentation
 * ```
 *
 * @see {@link ZodDocsGeneratorOptions} - Available generation options
 */
export { generateZodConfigDocs as generateDocs } from './docs/index.js'

/**
 * Generates JSON Schema from Zod configuration schemas.
 *
 * Creates standard JSON Schema that can be used for validation,
 * IDE support, and integration with other tools.
 *
 * @param schema - Zod configuration schema
 * @param options - JSON Schema generation options
 * @returns JSON Schema object
 *
 * @example
 * ```typescript
 * const jsonSchema = generateJsonSchema(serverSchema)
 * // Use with JSON Schema validators, OpenAPI, etc.
 * ```
 */
export { generateZodJsonSchema as generateJsonSchema } from './docs/index.js'

export type {
  ZodConfigDocs as ConfigDocs,
  ZodDocumentationSection as DocumentationSection,
  ZodFieldDocumentation as FieldDocumentation,
  ZodFieldConstraints as FieldConstraints,
  ZodValidationInfo as ValidationInfo,
  ZodExampleConfig as ExampleConfig,
  ZodDocsMetadata as DocsMetadata,
  ZodDocsGeneratorOptions as DocsGeneratorOptions,
  ZodJsonSchema as JsonSchema,
  ZodJsonSchemaProperty as JsonSchemaProperty,
} from './docs/index.js'

/**
 * Creates loader operations for configuration source loading.
 *
 * Provides registration and management of configuration loaders for different
 * source types (file, environment, CLI, remote, etc.).
 *
 * @returns Loader operations interface
 *
 * @example
 * ```typescript
 * const loaderOps = createLoaderOperations()
 * loaderOps.register(customS3Loader)
 * const result = await loaderOps.load(source)
 * ```
 *
 * @see {@link LoaderOperations} - Operations interface
 * @see {@link ConfigLoader} - Loader interface for custom implementations
 */
export { createLoaderOperations } from './loaders/operations.js'

/**
 * Creates validator operations for configuration validation.
 *
 * Provides registration and management of custom validators beyond
 * schema validation for complex business rules.
 *
 * @returns Validator operations interface
 *
 * @example
 * ```typescript
 * const validatorOps = createValidatorOperations()
 * validatorOps.register(databaseConnectivityValidator)
 * ```
 *
 * @see {@link ValidatorOperations} - Operations interface
 */
export { createValidatorOperations } from './validators/operations.js'

/**
 * Creates transformer operations for configuration data transformation.
 *
 * Provides registration and management of configuration transformers
 * for converting and normalizing configuration data.
 *
 * @returns Transformer operations interface
 *
 * @example
 * ```typescript
 * const transformerOps = createTransformerOperations()
 * transformerOps.register(environmentVariableExpander)
 * ```
 *
 * @see {@link TransformerOperations} - Operations interface
 */
export { createTransformerOperations } from './transformers/operations.js'

/**
 * Creates a configuration validation error with detailed context.
 *
 * @param details - Validation error details including field, value, and suggestions
 * @returns Configuration validation error
 *
 * @example
 * ```typescript
 * const error = createValidationError({
 *   field: 'port',
 *   value: -1,
 *   expectedType: 'positive number',
 *   suggestion: 'Use a port between 1 and 65535'
 * })
 * ```
 */
export { createValidationError } from './validation/index.js'

/**
 * Enhances Zod validation errors with additional context and formatting.
 *
 * @param zodError - Original Zod validation error
 * @param context - Additional context for the error
 * @returns Enhanced validation error with better messaging
 */
export { enhanceZodError } from './validation/index.js'

/**
 * Formats a validation error for display to users.
 *
 * @param error - Validation error to format
 * @param options - Formatting options
 * @returns Formatted error message
 *
 * @example
 * ```typescript
 * const formatted = formatValidationError(error, { colors: true })
 * console.error(formatted)
 * ```
 */
export { formatValidationError } from './validation/index.js'

/**
 * Formats multiple validation errors for display to users.
 *
 * @param errors - Array of validation errors to format
 * @param options - Formatting options
 * @returns Formatted error messages
 */
export { formatValidationErrors } from './validation/index.js'

export type { ValidationError, ValidationContext } from './validation/index.js'

// Type exports
export type {
  // Result types
  ConfigResult,

  // Configuration types
  ConfigDefinition,
  ConfigSource,
  ConfigSourceType,
  ConfigProperty,
  ConfigPropertyType,

  // State types
  ConfigState,
  ResolvedSource,
  ConfigMetadata,

  // Loader types
  ConfigLoader,
  ConfigWatchCallback,
  ConfigWatcher,

  // Transformer types
  ConfigTransformer,

  // Validator types
  ConfigValidator,

  // Operations types
  ConfigOperations,
  LoaderOperations,
  ValidatorOperations,
  TransformerOperations,

  // Manager types
  ConfigManager,
  ConfigChangeCallback,
  ConfigChange,

  // Options types
  FileLoaderOptions,
  EnvLoaderOptions,
  CLILoaderOptions,

  // Utility types
  DeepPartial,
  ConfigPath,
} from './types.js'
