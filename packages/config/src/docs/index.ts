// ========================================
// Documentation Module Exports
// ========================================

// Type definitions
export type { JsonSchemaOutput, JsonSchemaProperty } from './generator.js'

// Enhanced Zod-powered documentation generation (recommended)
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

export { generateZodConfigDocs, generateZodJsonSchema } from './zod-generator.js'

// Recommended API aliases
export {
  generateZodConfigDocs as generateDocs,
  generateZodJsonSchema as generateJsonSchemaFromZod,
} from './zod-generator.js'
