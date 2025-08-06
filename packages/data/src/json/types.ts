/**
 * @module json/types
 * @description Type definitions and defaults for JSON operations
 */

import type { JSONConfig, JSONProcessingOptions, JSONOperations, DataResult } from '../types.js'

// ========================================
// JSON Configuration Defaults
// ========================================

/**
 * Default configuration for JSON operations
 *
 * @constant
 * @type {JSONConfig}
 *
 * @property {string} encoding - File encoding (default: 'utf8')
 * @property {number} timeout - Operation timeout (default: 30000ms)
 * @property {number} maxSize - Max file size (default: 50MB)
 * @property {Function} [reviver] - JSON.parse reviver function
 * @property {Function} [replacer] - JSON.stringify replacer function
 * @property {string|number} [space] - Indentation for formatting
 * @property {boolean} allowTrailingCommas - Allow trailing commas (default: false)
 * @property {boolean} allowComments - Allow comments (default: false)
 */
export const defaultJSONConfig: Required<Omit<JSONConfig, 'reviver' | 'replacer' | 'space'>> &
  Pick<JSONConfig, 'reviver' | 'replacer' | 'space'> = {
  encoding: 'utf8',
  timeout: 30000,
  maxSize: 50 * 1024 * 1024, // 50MB
  reviver: undefined,
  replacer: undefined,
  space: undefined,
  allowTrailingCommas: false,
  allowComments: false,
} as const

// ========================================
// JSON Processing Types
// ========================================

export interface JSONStringifyOptions {
  readonly replacer?: (key: string, value: any) => any
  readonly space?: string | number
  readonly skipUndefined?: boolean
  readonly skipNull?: boolean
  readonly sortKeys?: boolean
}

export interface JSONFormatOptions {
  readonly indent?: number
  readonly sortKeys?: boolean
  readonly preserveArrays?: boolean
  readonly maxLineLength?: number
}

export interface JSONMinifyOptions {
  readonly preserveComments?: boolean
  readonly preserveNewlines?: boolean
}

// ========================================
// JSON Operations Function Types
// ========================================

export type JSONConfigProvider = () => JSONConfig
export type JSONParseFunction = (data: string, options?: JSONProcessingOptions) => DataResult<any>
export type JSONParseFileFunction = (
  filePath: string,
  options?: JSONProcessingOptions
) => Promise<DataResult<any>>
export type JSONStringifyFunction = (
  data: any,
  options?: JSONProcessingOptions
) => DataResult<string>
export type JSONWriteFileFunction = (
  data: any,
  filePath: string,
  options?: JSONProcessingOptions
) => Promise<DataResult<void>>
export type JSONValidateFunction = (data: string) => DataResult<boolean>
export type JSONMinifyFunction = (data: string) => DataResult<string>
export type JSONFormatFunction = (data: string, options?: JSONFormatOptions) => DataResult<string>

// ========================================
// JSON Factory Function Type
// ========================================

export type CreateJSONOperations = (config?: JSONConfig) => JSONOperations
