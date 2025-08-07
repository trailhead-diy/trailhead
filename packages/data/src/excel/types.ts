/**
 * @module excel/types
 * @description Type definitions and defaults for Excel operations
 */

import type {
  ExcelConfig,
  ExcelProcessingOptions,
  ExcelOperations,
  DataResult,
  ExcelFormatInfo,
} from '../types.js'

// ========================================
// Excel Configuration Defaults
// ========================================

/**
 * Default configuration for Excel operations
 *
 * @constant
 * @type {ExcelConfig}
 *
 * @property {string} encoding - File encoding (default: 'utf8')
 * @property {number} timeout - Operation timeout (default: 30000ms)
 * @property {number} maxSize - Max file size (default: 100MB)
 * @property {string} [worksheetName] - Specific worksheet to read
 * @property {number} worksheetIndex - Worksheet index (default: 0)
 * @property {boolean} hasHeader - First row contains headers (default: true)
 * @property {boolean} dynamicTyping - Auto-convert types (default: false)
 * @property {string} dateNF - Date format (default: 'yyyy-mm-dd')
 * @property {string} [range] - Cell range to read (e.g., 'A1:D10')
 * @property {number} header - Header row index (default: 0)
 * @property {boolean} cellDates - Parse dates to Date objects (default: true)
 * @property {any} defval - Default value for empty cells (default: '')
 */
export const defaultExcelConfig: Required<Omit<ExcelConfig, 'worksheetName' | 'range'>> &
  Pick<ExcelConfig, 'worksheetName' | 'range'> = {
  encoding: 'utf8',
  timeout: 30000,
  maxSize: 100 * 1024 * 1024, // 100MB
  worksheetName: undefined,
  worksheetIndex: 0,
  hasHeader: true,
  dynamicTyping: false,
  dateNF: 'yyyy-mm-dd',
  range: undefined,
  header: 0,
  cellDates: true,
  defval: '',
} as const

// ========================================
// Excel Processing Types
// ========================================

export interface ExcelWorksheet {
  readonly name: string
  readonly data: any[][]
  readonly range?: string
  readonly merges?: ExcelMergeRange[]
}

export interface ExcelMergeRange {
  readonly s: { c: number; r: number } // start cell
  readonly e: { c: number; r: number } // end cell
}

export interface ExcelWorkbookInfo {
  readonly worksheetNames: string[]
  readonly worksheetCount: number
  readonly properties?: {
    readonly title?: string
    readonly subject?: string
    readonly author?: string
    readonly company?: string
    readonly created?: Date
    readonly modified?: Date
  }
}

export interface ExcelCellInfo {
  readonly value: any
  readonly type: 'n' | 's' | 'b' | 'd' | 'e' | 'z' // number, string, boolean, date, error, empty
  readonly format?: string
  readonly style?: Record<string, any>
}

export interface ExcelParseOptions {
  readonly type?: 'base64' | 'binary' | 'buffer' | 'file' | 'array'
  readonly raw?: boolean
  readonly codepage?: number
  readonly cellFormula?: boolean
  readonly cellHTML?: boolean
  readonly cellNF?: boolean
  readonly cellStyles?: boolean
  readonly cellText?: boolean
  readonly cellDates?: boolean
  readonly dateNF?: string
  readonly sheetStubs?: boolean
  readonly sheetRows?: number
  readonly bookDeps?: boolean
  readonly bookFiles?: boolean
  readonly bookProps?: boolean
  readonly bookSheets?: boolean
  readonly bookVBA?: boolean
  readonly password?: string
  readonly WTF?: boolean
}

export interface ExcelWriteOptions {
  readonly bookType?: 'xlsx' | 'xlsm' | 'xlsb' | 'xls' | 'csv' | 'ods'
  readonly compression?: boolean
  readonly Props?: {
    readonly Title?: string
    readonly Subject?: string
    readonly Author?: string
    readonly Manager?: string
    readonly Company?: string
    readonly Category?: string
    readonly Keywords?: string
    readonly Comments?: string
    readonly LastAuthor?: string
    readonly CreatedDate?: Date
  }
}

// ========================================
// Excel Operations Function Types
// ========================================

export type ExcelConfigProvider = () => ExcelConfig
export type ExcelParseBufferFunction = (
  buffer: Buffer,
  options?: ExcelProcessingOptions
) => DataResult<any[]>
export type ExcelParseFileFunction = (
  filePath: string,
  options?: ExcelProcessingOptions
) => Promise<DataResult<any[]>>
export type ExcelStringifyFunction = (
  data: any[],
  options?: ExcelProcessingOptions
) => Promise<DataResult<Buffer>>
export type ExcelWriteFileFunction = (
  data: any[],
  filePath: string,
  options?: ExcelProcessingOptions
) => Promise<DataResult<void>>
export type ExcelValidateFunction = (buffer: Buffer) => DataResult<boolean>
export type ExcelDetectFormatFunction = (buffer: Buffer) => DataResult<ExcelFormatInfo>

// ========================================
// Excel Factory Function Type
// ========================================

export type CreateExcelOperations = (config?: ExcelConfig) => ExcelOperations
