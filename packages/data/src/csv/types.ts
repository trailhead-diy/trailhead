/**
 * @module csv/types
 * @description Type definitions and defaults for CSV operations
 */

import type {
  CSVConfig,
  CSVProcessingOptions,
  CSVOperations,
  DataResult,
  CSVFormatInfo,
  ParsedData,
} from '../types.js'

// ========================================
// CSV Configuration Defaults
// ========================================

/**
 * Default configuration for CSV operations
 *
 * @constant
 * @type {Required<CSVConfig>}
 *
 * @property {string} delimiter - Field delimiter (default: ',')
 * @property {string} quoteChar - Quote character (default: '"')
 * @property {string} escapeChar - Escape character (default: '"')
 * @property {boolean} hasHeader - First row contains headers (default: true)
 * @property {boolean} dynamicTyping - Auto-convert types (default: false)
 * @property {string} comments - Comment character (default: '')
 * @property {boolean} skipEmptyLines - Skip empty lines (default: true)
 * @property {string} encoding - File encoding (default: 'utf8')
 * @property {number} timeout - Operation timeout (default: 30000ms)
 * @property {number} maxSize - Max file size (default: 50MB)
 * @property {Function} transform - Value transformer
 * @property {Function} transformHeader - Header transformer
 * @property {boolean} detectDelimiter - Auto-detect delimiter (default: false)
 */
export const defaultCSVConfig: Required<CSVConfig> = {
  delimiter: ',',
  quoteChar: '"',
  escapeChar: '"',
  hasHeader: true,
  dynamicTyping: false,
  comments: '',
  skipEmptyLines: true,
  encoding: 'utf8',
  timeout: 30000,
  maxSize: 50 * 1024 * 1024, // 50MB
  transform: (value: string) => value,
  transformHeader: (header: string) => header.trim(),
  detectDelimiter: false,
} as const

// ========================================
// CSV Processing Types
// ========================================

export interface CSVParseResult {
  readonly data: any[]
  readonly errors: any[]
  readonly meta: {
    readonly delimiter: string
    readonly linebreak: string
    readonly aborted: boolean
    readonly truncated: boolean
    readonly cursor: number
    readonly fields?: string[]
  }
}

export interface CSVStringifyOptions {
  readonly delimiter?: string
  readonly quoteChar?: string
  readonly escapeChar?: string
  readonly header?: boolean
  readonly columns?: string[]
  readonly skipEmptyLines?: boolean
  readonly transform?: (value: any, field: string) => string
}

// ========================================
// CSV Operations Function Types
// ========================================

export type CSVConfigProvider = () => CSVConfig
export type CSVParseFunction = <T = Record<string, unknown>>(
  data: string,
  options?: CSVProcessingOptions
) => DataResult<ParsedData<T>>
export type CSVParseFileFunction = <T = Record<string, unknown>>(
  filePath: string,
  options?: CSVProcessingOptions
) => Promise<DataResult<ParsedData<T>>>
export type CSVStringifyFunction = <T = Record<string, unknown>>(
  data: readonly T[],
  options?: CSVProcessingOptions
) => DataResult<string>
export type CSVWriteFileFunction = <T = Record<string, unknown>>(
  data: readonly T[],
  filePath: string,
  options?: CSVProcessingOptions
) => Promise<DataResult<void>>
export type CSVValidateFunction = (data: string) => DataResult<boolean>
export type CSVDetectFormatFunction = (data: string) => DataResult<CSVFormatInfo>

// ========================================
// CSV Factory Function Type
// ========================================

export type CreateCSVOperations = (config?: CSVConfig) => CSVOperations
