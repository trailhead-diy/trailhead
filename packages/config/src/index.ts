// ========================================
// Main Configuration Package Exports
// ========================================

// Configuration operations
export { createConfigOperations } from './core/operations.js'
export { createConfigManager } from './core/manager.js'

// Enhanced Zod-powered schema builders
export {
  defineSchema,
  createSchema,
  validate,
  validateAsync,
  createZodSchema,
  string,
  number,
  boolean,
  array,
  object,
} from './core/index.js'

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

// Enhanced documentation generation
export {
  generateZodConfigDocs as generateDocs,
  generateZodJsonSchema as generateJsonSchema,
} from './docs/index.js'

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

// Sub-module exports
export { createLoaderOperations } from './loaders/operations.js'
export { createValidatorOperations } from './validators/operations.js'
export { createTransformerOperations } from './transformers/operations.js'

// Enhanced validation
export {
  createValidationError,
  enhanceZodError,
  formatValidationError,
  formatValidationErrors,
} from './validation/index.js'

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
