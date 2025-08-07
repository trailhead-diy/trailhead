/**
 * @module types
 * @description Type definitions for data processing operations
 *
 * Provides comprehensive type definitions for CSV, JSON, and Excel
 * data processing including configuration, options, and results.
 */

import type { Result, CoreError } from '@esteban-url/core'

// ========================================
// Configuration Types
// ========================================

/**
 * Base configuration for all data operations
 * @interface DataConfig
 * @property {BufferEncoding} [encoding='utf8'] - File encoding
 * @property {number} [timeout] - Operation timeout in milliseconds
 * @property {number} [maxSize] - Maximum file size in bytes
 */
export interface DataConfig {
  readonly encoding?: BufferEncoding
  readonly timeout?: number
  readonly maxSize?: number
}

/**
 * Configuration specific to CSV operations
 * @interface CSVConfig
 * @extends {DataConfig}
 * @property {string} [delimiter=','] - Field delimiter character
 * @property {string} [quoteChar='"'] - Quote character for fields
 * @property {string} [escapeChar='"'] - Escape character for quotes
 * @property {boolean} [hasHeader=true] - Whether first row contains headers
 * @property {boolean} [dynamicTyping=false] - Auto-convert numeric/boolean values
 * @property {string} [comments] - Character to treat as comment prefix
 * @property {boolean} [skipEmptyLines=true] - Skip empty lines
 * @property {Function} [transform] - Transform function for values
 * @property {Function} [transformHeader] - Transform function for headers
 * @property {boolean} [detectDelimiter=false] - Auto-detect delimiter
 */
export interface CSVConfig extends DataConfig {
  readonly delimiter?: string
  readonly quoteChar?: string
  readonly escapeChar?: string
  readonly hasHeader?: boolean
  readonly dynamicTyping?: boolean
  readonly comments?: string
  readonly skipEmptyLines?: boolean
  readonly transform?: (value: string, field: string) => any
  readonly transformHeader?: (header: string) => string
  readonly detectDelimiter?: boolean
}

/**
 * Configuration specific to JSON operations
 * @interface JSONConfig
 * @extends {DataConfig}
 * @property {Function} [reviver] - JSON.parse reviver function
 * @property {Function} [replacer] - JSON.stringify replacer function
 * @property {string|number} [space] - JSON.stringify indentation
 * @property {boolean} [allowTrailingCommas=false] - Allow trailing commas in JSON
 * @property {boolean} [allowComments=false] - Allow comments in JSON
 */
export interface JSONConfig extends DataConfig {
  readonly reviver?: (key: string, value: any) => any
  readonly replacer?: (key: string, value: any) => any
  readonly space?: string | number
  readonly allowTrailingCommas?: boolean
  readonly allowComments?: boolean
}

/**
 * Configuration specific to Excel operations
 * @interface ExcelConfig
 * @extends {DataConfig}
 * @property {string} [worksheetName] - Worksheet name to read/write
 * @property {number} [worksheetIndex=0] - Worksheet index to read/write
 * @property {boolean} [hasHeader=true] - Whether first row contains headers
 * @property {boolean} [dynamicTyping=false] - Auto-convert numeric/date values
 * @property {string} [dateNF] - Date number format
 * @property {string} [range] - Cell range to read (e.g., 'A1:D10')
 * @property {number} [header] - Row index containing headers
 * @property {boolean} [cellDates=false] - Parse dates to Date objects
 * @property {any} [defval] - Default value for empty cells
 */
export interface ExcelConfig extends DataConfig {
  readonly worksheetName?: string
  readonly worksheetIndex?: number
  readonly hasHeader?: boolean
  readonly dynamicTyping?: boolean
  readonly dateNF?: string
  readonly range?: string
  readonly header?: number
  readonly cellDates?: boolean
  readonly defval?: any
}

// ========================================
// Processing Options Types
// ========================================

/**
 * Base processing options for all data operations
 * @interface ProcessingOptions
 * @property {boolean} [autoTrim=true] - Automatically trim whitespace
 * @property {boolean} [skipEmptyLines=true] - Skip empty lines
 * @property {boolean} [errorTolerant=false] - Continue on errors
 * @property {number} [maxRows] - Maximum number of rows to process
 * @property {Function} [onError] - Error callback handler
 */
export interface ProcessingOptions {
  readonly autoTrim?: boolean
  readonly skipEmptyLines?: boolean
  readonly errorTolerant?: boolean
  readonly maxRows?: number
  readonly onError?: (error: CoreError, context?: Record<string, unknown>) => void
}

export interface CSVProcessingOptions extends ProcessingOptions {
  readonly delimiter?: string
  readonly quoteChar?: string
  readonly escapeChar?: string
  readonly hasHeader?: boolean
  readonly dynamicTyping?: boolean
  readonly transformHeader?: (header: string) => string
  readonly detectDelimiter?: boolean
  readonly comments?: string
  readonly transform?: (value: string, field: string) => any
}

export interface JSONProcessingOptions extends ProcessingOptions {
  readonly allowTrailingCommas?: boolean
  readonly allowComments?: boolean
  readonly allowSingleQuotes?: boolean
  readonly allowUnquotedKeys?: boolean
  readonly reviver?: (key: string, value: any) => any
  readonly replacer?: (key: string, value: any) => any
  readonly space?: string | number
}

export interface ExcelProcessingOptions extends ProcessingOptions {
  readonly worksheetName?: string
  readonly worksheetIndex?: number
  readonly hasHeader?: boolean
  readonly dynamicTyping?: boolean
  readonly dateNF?: string
  readonly cellNF?: boolean
  readonly defval?: any
  readonly range?: string
  readonly header?: number
  readonly password?: string
  readonly bookSST?: boolean
  readonly cellHTML?: boolean
  readonly cellStyles?: boolean
  readonly cellDates?: boolean
  readonly sheetStubs?: boolean
  readonly blankrows?: boolean
  readonly bookVBA?: boolean
}

// ========================================
// Result Types - Use standard Result<T, CoreError>
// ========================================

/**
 * Standard Result type for all data operations
 * @typedef {Result<T, CoreError>} DataResult<T>
 * @template T - Success value type
 */
export type DataResult<T> = Result<T, CoreError>

/**
 * Enhanced parsed data structure with metadata and error tracking
 * @interface ParsedData
 * @template T - Type of parsed data rows
 * @property {readonly T[]} data - Array of parsed data objects
 * @property {ParseMetadata} metadata - Parsing metadata
 * @property {readonly ParseError[]} errors - Non-fatal parsing errors
 */
export interface ParsedData<T = Record<string, unknown>> {
  readonly data: readonly T[]
  readonly metadata: ParseMetadata
  readonly errors: readonly ParseError[]
}

/**
 * Metadata about the parsing operation
 * @interface ParseMetadata
 * @property {number} totalRows - Total number of rows parsed
 * @property {string} format - Detected or specified format
 * @property {boolean} hasHeaders - Whether headers were detected/used
 * @property {string} [encoding] - File encoding used
 * @property {number} [processingTime] - Time taken in milliseconds
 */
export interface ParseMetadata {
  readonly totalRows: number
  readonly format: string
  readonly hasHeaders: boolean
  readonly encoding?: string
  readonly processingTime?: number
}

/**
 * Non-fatal error encountered during parsing
 * @interface ParseError
 * @property {string} type - Error type classification
 * @property {string} code - Error code for programmatic handling
 * @property {string} message - Human-readable error message
 * @property {number} [row] - Row number where error occurred
 * @property {number} [column] - Column number where error occurred
 * @property {string} [field] - Field name where error occurred
 */
export interface ParseError {
  readonly type: string
  readonly code: string
  readonly message: string
  readonly row?: number
  readonly column?: number
  readonly field?: string
}

/**
 * Result of format detection operation
 * @interface FormatDetectionResult
 * @property {'csv' | 'json' | 'excel' | 'unknown'} format - Detected format
 * @property {number} confidence - Confidence score (0-1)
 * @property {Object} [details] - Format-specific details
 * @property {string} [details.delimiter] - CSV delimiter detected
 * @property {boolean} [details.hasHeader] - Headers detected
 * @property {string} [details.structure] - Data structure type
 * @property {string[]} [details.worksheetNames] - Excel worksheet names
 * @property {number} [details.worksheetCount] - Number of worksheets
 */
export interface FormatDetectionResult {
  readonly format: 'csv' | 'json' | 'excel' | 'unknown'
  readonly confidence: number
  readonly details?: {
    readonly delimiter?: string
    readonly hasHeader?: boolean
    readonly structure?: string
    readonly worksheetNames?: string[]
    readonly worksheetCount?: number
  }
}

export interface CSVFormatInfo {
  readonly delimiter: string
  readonly quoteChar: string
  readonly hasHeader: boolean
  readonly rowCount: number
  readonly columnCount: number
}

export interface ExcelFormatInfo {
  readonly worksheetNames: string[]
  readonly worksheetCount: number
  readonly hasData: boolean
}

// ========================================
// Operational Types
// ========================================

/**
 * Function type for parsing string data
 * @typedef {Function} ParseOperation
 * @template T - Output data type
 * @template O - Options type
 * @param {string} data - Data to parse
 * @param {O} [options] - Parsing options
 * @returns {DataResult<T>} Parsed result or error
 */
export type ParseOperation<T, O = ProcessingOptions> = (data: string, options?: O) => DataResult<T>

/**
 * Function type for parsing file data
 * @typedef {Function} ParseFileOperation
 * @template T - Output data type
 * @template O - Options type
 * @param {string} filePath - Path to file
 * @param {O} [options] - Parsing options
 * @returns {Promise<DataResult<T>>} Async parsed result or error
 */
export type ParseFileOperation<T, O = ProcessingOptions> = (
  filePath: string,
  options?: O
) => Promise<DataResult<T>>

/**
 * Function type for stringifying data
 * @typedef {Function} StringifyOperation
 * @template T - Input data type
 * @template O - Options type
 * @param {T} data - Data to stringify
 * @param {O} [options] - Stringify options
 * @returns {DataResult<string>} Stringified result or error
 */
export type StringifyOperation<T, O = ProcessingOptions> = (
  data: T,
  options?: O
) => DataResult<string>

/**
 * Function type for writing data to file
 * @typedef {Function} WriteFileOperation
 * @template T - Input data type
 * @template O - Options type
 * @param {T} data - Data to write
 * @param {string} filePath - Output file path
 * @param {O} [options] - Write options
 * @returns {Promise<DataResult<void>>} Async write result or error
 */
export type WriteFileOperation<T, O = ProcessingOptions> = (
  data: T,
  filePath: string,
  options?: O
) => Promise<DataResult<void>>

/** Validation function for string or buffer data */
export type ValidateOperation = (data: string | Buffer) => DataResult<boolean>
/** Validation function for string data */
export type ValidateStringOperation = (data: string) => DataResult<boolean>
/** Validation function for buffer data */
export type ValidateBufferOperation = (data: Buffer) => DataResult<boolean>

// ========================================
// Processor Function Types
// ========================================

export interface CSVOperations {
  readonly parseString: <T = Record<string, unknown>>(
    data: string,
    options?: CSVProcessingOptions
  ) => DataResult<ParsedData<T>>
  readonly parseFile: <T = Record<string, unknown>>(
    filePath: string,
    options?: CSVProcessingOptions
  ) => Promise<DataResult<ParsedData<T>>>
  readonly stringify: <T = Record<string, unknown>>(
    data: readonly T[],
    options?: CSVProcessingOptions
  ) => DataResult<string>
  readonly writeFile: <T = Record<string, unknown>>(
    data: readonly T[],
    filePath: string,
    options?: CSVProcessingOptions
  ) => Promise<DataResult<void>>
  readonly validate: ValidateStringOperation
  readonly detectFormat: (data: string) => DataResult<CSVFormatInfo>
  readonly parseToObjects: (
    data: string,
    options?: CSVProcessingOptions
  ) => DataResult<ParsedData<Record<string, unknown>>>
  readonly parseToArrays: (
    data: string,
    options?: CSVProcessingOptions
  ) => DataResult<ParsedData<readonly string[]>>
  readonly fromObjects: (
    data: readonly Record<string, unknown>[],
    options?: CSVProcessingOptions
  ) => DataResult<string>
  readonly fromArrays: (
    data: readonly (readonly string[])[],
    options?: CSVProcessingOptions
  ) => DataResult<string>
}

export interface JSONOperations {
  readonly parseString: ParseOperation<any, JSONProcessingOptions>
  readonly parseFile: ParseFileOperation<any, JSONProcessingOptions>
  readonly stringify: StringifyOperation<any, JSONProcessingOptions>
  readonly writeFile: WriteFileOperation<any, JSONProcessingOptions>
  readonly validate: ValidateStringOperation
  readonly minify: (data: string) => DataResult<string>
  readonly format: (
    data: string,
    options?: { indent?: number; sortKeys?: boolean }
  ) => DataResult<string>
}

export interface ExcelOperations {
  readonly parseBuffer: (buffer: Buffer, options?: ExcelProcessingOptions) => DataResult<any[]>
  readonly parseFile: ParseFileOperation<any[], ExcelProcessingOptions>
  readonly parseWorksheet: (
    buffer: Buffer,
    worksheetName: string,
    options?: ExcelProcessingOptions
  ) => DataResult<any[]>
  readonly parseWorksheetByIndex: (
    buffer: Buffer,
    worksheetIndex: number,
    options?: ExcelProcessingOptions
  ) => DataResult<any[]>
  readonly stringify: (data: any[], options?: ExcelProcessingOptions) => Promise<DataResult<Buffer>>
  readonly writeFile: WriteFileOperation<any[], ExcelProcessingOptions>
  readonly validate: ValidateBufferOperation
  readonly detectFormat: (buffer: Buffer) => DataResult<ExcelFormatInfo>
  readonly parseToObjects: (
    buffer: Buffer,
    options?: ExcelProcessingOptions
  ) => DataResult<Record<string, any>[]>
  readonly parseToArrays: (buffer: Buffer, options?: ExcelProcessingOptions) => DataResult<any[][]>
  readonly fromObjects: (
    objects: Record<string, any>[],
    options?: ExcelProcessingOptions
  ) => Promise<DataResult<Buffer>>
  readonly fromArrays: (
    arrays: any[][],
    options?: ExcelProcessingOptions
  ) => Promise<DataResult<Buffer>>
  readonly getWorksheetNames: (buffer: Buffer) => DataResult<string[]>
  readonly createWorkbook: (
    worksheets: { name: string; data: any[][] }[]
  ) => Promise<DataResult<Buffer>>
}
