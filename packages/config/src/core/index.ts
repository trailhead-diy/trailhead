// ========================================
// Legacy Schema Builder (Backwards Compatibility)
// ========================================

export {
  defineConfigSchema,
  createSchemaBuilder,
  validateWithSchema,
  string as legacyString,
  number as legacyNumber,
  boolean as legacyBoolean,
  array as legacyArray,
  object as legacyObject,
} from './schema.js';

export type {
  ConfigResult,
  SchemaField,
  SchemaFieldType,
  ConfigSchema,
  SchemaFields,
  OptionalSchemaFields,
  SchemaBuilder,
  FieldBuilder,
  StringFieldBuilder,
  NumberFieldBuilder,
  ArrayFieldBuilder,
  ObjectFieldBuilder,
} from './schema.js';

// ========================================
// Enhanced Zod-Powered Schema Builder (Recommended)
// ========================================

export {
  defineZodConfigSchema,
  createZodSchemaBuilder,
  validateWithZodSchema,
  validateWithZodSchemaAsync,
  createZodSchema,
  zodString,
  zodNumber,
  zodBoolean,
  zodArray,
  zodObject,
} from './zod-schema.js';

export type {
  ZodConfigSchema,
  ZodSchemaBuilder,
  ZodStringFieldBuilder,
  ZodNumberFieldBuilder,
  ZodBooleanFieldBuilder,
  ZodArrayFieldBuilder,
  ZodObjectFieldBuilder,
  ZodFieldBuilder,
} from './zod-schema.js';

// ========================================
// Configuration Operations
// ========================================

export { createConfigOperations } from './operations.js';
export { createConfigManager } from './manager.js';

export type {
  ConfigOperations,
  ConfigManager,
  ConfigChangeCallback,
  ConfigChange,
} from '../types.js';

// ========================================
// Recommended API (Zod-Based)
// ========================================

// Re-export the recommended Zod-based API with cleaner names
export {
  defineZodConfigSchema as defineSchema,
  createZodSchemaBuilder as createSchema,
  validateWithZodSchema as validate,
  validateWithZodSchemaAsync as validateAsync,
  zodString as string,
  zodNumber as number,
  zodBoolean as boolean,
  zodArray as array,
  zodObject as object,
} from './zod-schema.js';
