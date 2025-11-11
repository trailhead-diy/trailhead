/**
 * @module excel
 * @description Excel data processing operations
 *
 * Provides comprehensive Excel parsing and writing operations with support
 * for multiple worksheets, cell formatting, and data type conversion.
 *
 * @example Basic Excel parsing
 * ```typescript
 * import { createExcelOperations } from '@trailhead/data/excel'
 *
 * const excelOps = createExcelOperations()
 * const result = await excelOps.parseFile('report.xlsx')
 * if (result.isOk()) {
 *   console.log(result.value.data) // Parsed rows
 * }
 * ```
 *
 * @example Specific worksheet
 * ```typescript
 * const excelOps = createExcelOperations({
 *   worksheetName: 'Summary',
 *   hasHeader: true
 * })
 * ```
 */

/** Factory function to create Excel operations */
export { createExcelOperations } from './core.js'

/** Default Excel configuration settings */
export { defaultExcelConfig } from './types.js'

/** Excel type exports */
export type {
  ExcelConfigProvider,
  ExcelParseBufferFunction,
  ExcelParseFileFunction,
  ExcelStringifyFunction,
  ExcelWriteFileFunction,
  ExcelValidateFunction,
  ExcelDetectFormatFunction,
  CreateExcelOperations,
  ExcelWorksheet,
  ExcelMergeRange,
  ExcelWorkbookInfo,
  ExcelCellInfo,
  ExcelParseOptions,
  ExcelWriteOptions,
} from './types.js'

// Re-export main types from data types
export type { ExcelOperations } from '../types.js'
