export { createJSONOperations } from './core.js'
export { defaultJSONConfig } from './types.js'
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
