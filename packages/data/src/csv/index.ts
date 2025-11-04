/**
 * @module csv
 * @description CSV data processing operations
 *
 * Provides comprehensive CSV parsing, stringifying, and file operations
 * with support for custom delimiters, headers, and type conversion.
 *
 * @example Basic CSV parsing
 * ```typescript
 * import { createCSVOperations } from '@trailhead/data/csv'
 *
 * const csvOps = createCSVOperations()
 * const result = await csvOps.parseFile('data.csv')
 * if (result.isOk()) {
 *   console.log(result.value.data) // Parsed rows
 * }
 * ```
 *
 * @example Custom delimiter
 * ```typescript
 * const csvOps = createCSVOperations({ delimiter: ';' })
 * const result = csvOps.parseString('name;age\\nJohn;30')
 * ```
 */

/** Factory function to create CSV operations */
export { createCSVOperations } from './core.js'

/** Default CSV configuration settings */
export { defaultCSVConfig } from './types.js'

/** CSV type exports */
export type {
  CSVConfigProvider,
  CSVParseFunction,
  CSVParseFileFunction,
  CSVStringifyFunction,
  CSVWriteFileFunction,
  CSVValidateFunction,
  CSVDetectFormatFunction,
  CreateCSVOperations,
  CSVParseResult,
  CSVStringifyOptions,
} from './types.js'

// Re-export main types from data types
export type { CSVOperations } from '../types.js'
