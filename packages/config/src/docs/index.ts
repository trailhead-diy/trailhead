// ========================================
// Documentation Module Exports
// ========================================

// Legacy documentation generation (backwards compatibility)
export type {
  ConfigDocs,
  DocumentationSection,
  FieldDocumentation,
  FieldConstraints,
  ValidationInfo,
  ExampleConfig,
  DocsMetadata,
  DocsGeneratorOptions,
  MarkdownOptions,
  JsonSchemaOutput,
  JsonSchemaProperty,
} from './generator.js';

export { generateConfigDocs, generateMarkdown, generateJsonSchema } from './generator.js';

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
} from './zod-generator.js';

export { generateZodConfigDocs, generateZodJsonSchema } from './zod-generator.js';

// Recommended API aliases
export {
  generateZodConfigDocs as generateDocs,
  generateZodJsonSchema as generateJsonSchemaFromZod,
} from './zod-generator.js';

// Schema introspection
export type {
  SchemaIntrospection,
  SchemaStructure,
  FieldIntrospection,
  SchemaBranch,
  FieldConstraintSummary,
  FieldValidationInfo,
  FieldComplexity,
  ComplexityFactor,
  SchemaStatistics,
  FieldRelationship,
  ValidationRules,
  CrossFieldRule,
  CustomValidatorInfo,
  ComplexityMetrics,
  IntrospectionOptions,
} from './introspection.js';

export {
  introspectSchema,
  findFieldsByType,
  findFieldsByComplexity,
  findFieldsWithConstraints,
  findFieldsWithCustomValidation,
  getFieldByPath,
} from './introspection.js';
