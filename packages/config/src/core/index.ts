// ========================================
// Core Schema Builder Exports (Zod-Powered)
// ========================================

/**
 * Enhanced Zod-powered schema builder exports with convenient aliases.
 *
 * Provides the main schema building functions with simplified names
 * for easier imports and more readable schema definitions.
 */
export {
  defineZodConfigSchema as defineSchema,
  createZodSchemaBuilder as createSchema,
  validateWithZodSchema as validate,
  validateWithZodSchemaAsync as validateAsync,
  createZodSchema,
  zodString as string,
  zodNumber as number,
  zodBoolean as boolean,
  zodArray as array,
  zodObject as object,
} from './zod-schema.js'

export type {
  ZodConfigSchema as ConfigSchema,
  ZodSchemaBuilder as SchemaBuilder,
  ZodStringFieldBuilder as StringFieldBuilder,
  ZodNumberFieldBuilder as NumberFieldBuilder,
  ZodBooleanFieldBuilder as BooleanFieldBuilder,
  ZodArrayFieldBuilder as ArrayFieldBuilder,
  ZodObjectFieldBuilder as ObjectFieldBuilder,
  ZodFieldBuilder as FieldBuilder,
} from './zod-schema.js'

/**
 * Configuration operations factory function.
 *
 * @see {@link createConfigOperations} - Main operations factory
 */
export { createConfigOperations } from './operations.js'

/**
 * Configuration manager factory function.
 *
 * @see {@link createConfigManager} - Manager factory with lifecycle management
 */
export { createConfigManager } from './manager.js'

export type {
  ConfigOperations,
  ConfigManager,
  ConfigChangeCallback,
  ConfigChange,
} from '../types.js'
