// ========================================
// Documentation Module Exports
// ========================================

/**
 * Type definitions for JSON schema generation and documentation output.
 *
 * These types define the structure of generated documentation and JSON schemas
 * for configuration schemas and validation rules.
 */
export type { JsonSchemaOutput, JsonSchemaProperty } from './generator.js'

/**
 * Enhanced Zod-powered documentation generation types (recommended approach).
 *
 * Provides comprehensive type definitions for generating documentation from
 * Zod configuration schemas with rich metadata, validation info, and examples.
 */
export type {
  ZodConfigDocs,
  ZodDocumentationSection,
  ZodFieldDocumentation,
  ZodFieldConstraints,
  ZodValidationInfo,
  ZodExampleConfig,
  ZodDocsMetadata,
  ZodDocsGeneratorOptions,
  ZodJsonSchema,
  ZodJsonSchemaProperty,
} from './zod-generator.js'

/**
 * Main documentation generation functions using Zod schemas.
 *
 * These functions generate comprehensive documentation and JSON schemas
 * from Zod configuration schemas with full type safety and metadata.
 */
export { generateZodConfigDocs, generateZodJsonSchema } from './zod-generator.js'

/**
 * Recommended API aliases for convenient access to documentation generation.
 *
 * These aliases provide shorter, more convenient names for the main
 * documentation generation functions while maintaining full functionality.
 */
export {
  generateZodConfigDocs as generateDocs,
  generateZodJsonSchema as generateJsonSchemaFromZod,
} from './zod-generator.js'
