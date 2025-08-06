/**
 * @module json
 * @description JSON data processing operations
 *
 * Provides comprehensive JSON parsing, stringifying, formatting, and validation
 * with support for custom revivers, replacers, and extended JSON features.
 *
 * @example Basic JSON parsing
 * ```typescript
 * import { createJSONOperations } from '@esteban-url/data/json'
 *
 * const jsonOps = createJSONOperations()
 * const result = await jsonOps.parseFile('data.json')
 * if (result.isOk()) {
 *   console.log(result.value.data) // Parsed object/array
 * }
 * ```
 *
 * @example JSON formatting
 * ```typescript
 * const jsonOps = createJSONOperations()
 * const formatted = jsonOps.format('{"name":"John","age":30}')
 * // Returns prettified JSON with proper indentation
 * ```
 */

/** Factory function to create JSON operations */
export { createJSONOperations } from './core.js'

/** Default JSON configuration settings */
export { defaultJSONConfig } from './types.js'

/** JSON type exports */
export type {
  JSONConfigProvider,
  JSONParseFunction,
  JSONParseFileFunction,
  JSONStringifyFunction,
  JSONWriteFileFunction,
  JSONValidateFunction,
  JSONMinifyFunction,
  JSONFormatFunction,
  CreateJSONOperations,
  JSONStringifyOptions,
  JSONFormatOptions,
  JSONMinifyOptions,
} from './types.js'

// Re-export main types from data types
export type { JSONOperations } from '../types.js'
