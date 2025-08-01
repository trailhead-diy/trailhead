/**
 * Unified Data Operations - Clean API for data processing with auto-detection
 *
 * This module provides the main entry point for all data operations,
 * combining format detection with data processing for a seamless experience.
 */

import { ok, err, type Result, type CoreError } from '@esteban-url/core'

// Import existing operations
import { createCSVOperations, type CSVOperations } from './csv/index.js'
import { createJSONOperations, type JSONOperations } from './json/index.js'
import { createExcelOperations, type ExcelOperations } from './excel/index.js'

// Import format detection
import { createDetectionOperations, type DetectionOperations } from './detection/index.js'
import { createMimeOperations } from './mime/index.js'

// Import types
import type { DataConfig, DataResult } from './types.js'
import type { FormatConfig } from './formats-types.js'
import { createDataError } from './errors.js'

// ========================================
// Unified Configuration
// ========================================

export interface UnifiedDataConfig {
  csv?: DataConfig
  json?: DataConfig
  excel?: DataConfig
  detection?: FormatConfig
  mime?: FormatConfig
  autoDetect?: boolean
  defaultFormat?: 'csv' | 'json' | 'excel'
}

// ========================================
// Unified Data Operations Interface
// ========================================

export interface UnifiedDataOperations {
  // Auto-detection + processing (main API)
  parseAuto: (filePath: string) => Promise<DataResult<any>>
  parseAutoFromContent: (content: string, fileName?: string) => Promise<DataResult<any>>
  writeAuto: (filePath: string, data: any) => Promise<Result<void, CoreError>>

  // Format-specific operations (still available)
  parseCSV: CSVOperations['parseFile']
  parseJSON: JSONOperations['parseFile']
  parseExcel: ExcelOperations['parseFile']

  parseCSVFromContent: CSVOperations['parseString']
  parseJSONFromContent: JSONOperations['parseString']
  parseExcelFromContent: ExcelOperations['parseBuffer']

  // Format detection (when needed separately)
  detectFormat: (filePath: string) => Promise<Result<string, CoreError>>
  detectFormatFromContent: (content: string, fileName?: string) => Result<string, CoreError>

  // Conversion utilities
  convertFormat: (data: any, targetFormat: 'csv' | 'json' | 'excel') => Result<string, CoreError>
}

// ========================================
// Auto-Detection Helpers
// ========================================

async function detectFileFormat(
  filePath: string,
  detection: DetectionOperations
): Promise<Result<'csv' | 'json' | 'excel', CoreError>> {
  const result = await detection.detectFromFile(filePath)

  if (result.isErr()) {
    return err(result.error)
  }

  const detectedFormat = result.value.format.mime

  // Map detected formats to supported data formats
  switch (detectedFormat) {
    case 'application/json':
    case 'text/json':
      return ok('json')
    case 'text/csv':
    case 'application/csv':
      return ok('csv')
    case 'application/vnd.ms-excel':
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return ok('excel')
    default:
      // Try to infer from extension
      const ext = filePath.toLowerCase().split('.').pop()
      if (ext === 'json') return ok('json')
      if (ext === 'csv') return ok('csv')
      if (ext === 'xlsx' || ext === 'xls') return ok('excel')

      return err(
        createDataError(
          'UNSUPPORTED_FORMAT',
          'DATA_UNSUPPORTED_FORMAT',
          `Cannot determine data format for file: ${filePath}`,
          {
            details: `Detected format: ${detectedFormat}`,
            context: { filePath, detectedFormat },
          }
        )
      )
  }
}

function detectContentFormat(
  content: string,
  fileName?: string
): Result<'csv' | 'json' | 'excel', CoreError> {
  const trimmed = content.trim()

  // JSON detection
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      JSON.parse(trimmed)
      return ok('json')
    } catch {
      // Continue to other formats
    }
  }

  // CSV detection (simple heuristic)
  if (trimmed.includes(',') && trimmed.includes('\n') && !trimmed.includes('<')) {
    return ok('csv')
  }

  // Try file extension if provided
  if (fileName) {
    const ext = fileName.toLowerCase().split('.').pop()
    if (ext === 'json') return ok('json')
    if (ext === 'csv') return ok('csv')
    if (ext === 'xlsx' || ext === 'xls') return ok('excel')
  }

  return err(
    createDataError(
      'FORMAT_DETECTION_FAILED',
      'DATA_FORMAT_DETECTION_FAILED',
      'Cannot determine data format from content',
      {
        details: 'Content does not match known patterns',
        context: { fileName, contentLength: content.length },
      }
    )
  )
}

// ========================================
// Unified Operations Factory
// ========================================

export function createUnifiedDataOperations(config: UnifiedDataConfig = {}): UnifiedDataOperations {
  const csvOps = createCSVOperations(config.csv)
  const jsonOps = createJSONOperations(config.json)
  const excelOps = createExcelOperations(config.excel)
  const detection = createDetectionOperations(config.detection)
  const _mime = createMimeOperations(config.mime)

  return {
    // ========================================
    // Auto-Detection + Processing (Main API)
    // ========================================

    async parseAuto(filePath: string): Promise<DataResult<any>> {
      try {
        const formatResult = await detectFileFormat(filePath, detection)
        if (formatResult.isErr()) {
          return err(formatResult.error)
        }

        const format = formatResult.value

        switch (format) {
          case 'csv':
            return await csvOps.parseFile(filePath)
          case 'json':
            return await jsonOps.parseFile(filePath)
          case 'excel':
            return await excelOps.parseFile(filePath)
          default:
            return err(
              createDataError(
                'UNSUPPORTED_FORMAT',
                'DATA_UNSUPPORTED_FORMAT',
                `Unsupported data format: ${format}`,
                {
                  details: `File: ${filePath}`,
                  context: { filePath, format },
                }
              )
            )
        }
      } catch (error) {
        return err(
          createDataError(
            'PARSE_AUTO_FAILED',
            'DATA_PARSING_FAILED',
            `Auto-parsing failed for file: ${filePath}`,
            {
              details: String(error),
              context: { filePath, error },
            }
          )
        )
      }
    },

    async parseAutoFromContent(content: string, fileName?: string): Promise<DataResult<any>> {
      try {
        const formatResult = detectContentFormat(content, fileName)
        if (formatResult.isErr()) {
          return err(formatResult.error)
        }

        const format = formatResult.value

        switch (format) {
          case 'csv':
            return csvOps.parseString(content)
          case 'json':
            return jsonOps.parseString(content)
          case 'excel':
            // Excel needs buffer, try to convert if possible
            return err(
              createDataError(
                'EXCEL_FROM_STRING_UNSUPPORTED',
                'DATA_UNSUPPORTED_FORMAT',
                'Excel format cannot be parsed from string content',
                {
                  details: 'Use parseExcelFromContent with Buffer instead',
                  context: { fileName },
                }
              )
            )
          default:
            return err(
              createDataError(
                'UNSUPPORTED_FORMAT',
                'DATA_UNSUPPORTED_FORMAT',
                `Unsupported data format: ${format}`,
                {
                  details: `Content length: ${content.length}`,
                  context: { fileName, format, contentLength: content.length },
                }
              )
            )
        }
      } catch (error) {
        return err(
          createDataError(
            'PARSE_AUTO_CONTENT_FAILED',
            'DATA_PARSING_FAILED',
            'Auto-parsing failed for content',
            {
              details: String(error),
              context: { fileName, error, contentLength: content.length },
            }
          )
        )
      }
    },

    async writeAuto(filePath: string, data: any): Promise<Result<void, CoreError>> {
      try {
        const ext = filePath.toLowerCase().split('.').pop()

        switch (ext) {
          case 'json':
            return await jsonOps.writeFile(filePath, data)
          case 'csv':
            // Ensure data is an array for CSV
            if (!Array.isArray(data)) {
              return err(
                createDataError(
                  'INVALID_CSV_DATA',
                  'DATA_UNSUPPORTED_FORMAT',
                  'CSV write requires array data',
                  {
                    details: 'Data must be an array of objects',
                    context: { filePath, dataType: typeof data },
                  }
                )
              )
            }
            return await csvOps.writeFile(data, filePath)
          case 'xlsx':
          case 'xls':
            // Ensure data is an array for Excel
            if (!Array.isArray(data)) {
              return err(
                createDataError(
                  'INVALID_EXCEL_DATA',
                  'DATA_UNSUPPORTED_FORMAT',
                  'Excel write requires array data',
                  {
                    details: 'Data must be an array of objects',
                    context: { filePath, dataType: typeof data },
                  }
                )
              )
            }
            return await excelOps.writeFile(data, filePath)
          default:
            // Default to JSON if no extension
            const jsonPath = filePath.endsWith('.json') ? filePath : `${filePath}.json`
            return await jsonOps.writeFile(jsonPath, data)
        }
      } catch (error) {
        return err(
          createDataError(
            'WRITE_AUTO_FAILED',
            'DATA_CONVERSION_FAILED',
            `Auto-writing failed for file: ${filePath}`,
            {
              details: String(error),
              context: { filePath, error },
            }
          )
        )
      }
    },

    // ========================================
    // Format-Specific Operations (Direct Access)
    // ========================================

    parseCSV: csvOps.parseFile,
    parseJSON: jsonOps.parseFile,
    parseExcel: excelOps.parseFile,

    parseCSVFromContent: csvOps.parseString,
    parseJSONFromContent: jsonOps.parseString,
    parseExcelFromContent: excelOps.parseBuffer,

    // ========================================
    // Format Detection (Standalone)
    // ========================================

    async detectFormat(filePath: string): Promise<Result<string, CoreError>> {
      const result = await detection.detectFromFile(filePath)
      if (result.isErr()) {
        return err(result.error)
      }
      return ok(result.value.format.mime)
    },

    detectFormatFromContent(content: string, fileName?: string): Result<string, CoreError> {
      const result = detectContentFormat(content, fileName)
      if (result.isErr()) {
        return err(result.error)
      }
      return ok(result.value)
    },

    // ========================================
    // Format Conversion
    // ========================================

    convertFormat(data: any, targetFormat: 'csv' | 'json' | 'excel'): Result<string, CoreError> {
      try {
        switch (targetFormat) {
          case 'json':
            return ok(JSON.stringify(data, null, 2))
          case 'csv':
            if (Array.isArray(data) && data.length > 0) {
              const headers = Object.keys(data[0])
              const csvLines = [
                headers.join(','),
                ...data.map((row) => headers.map((header) => String(row[header] || '')).join(',')),
              ]
              return ok(csvLines.join('\n'))
            }
            return err(
              createDataError(
                'CSV_CONVERSION_FAILED',
                'DATA_CONVERSION_FAILED',
                'Data must be an array of objects for CSV conversion',
                {
                  details: 'Invalid data structure',
                  context: { dataType: typeof data, isArray: Array.isArray(data) },
                }
              )
            )
          case 'excel':
            return err(
              createDataError(
                'EXCEL_CONVERSION_UNSUPPORTED',
                'DATA_UNSUPPORTED_FORMAT',
                'Excel conversion to string not supported',
                {
                  details: 'Use Excel operations directly for Excel output',
                  context: { targetFormat },
                }
              )
            )
          default:
            return err(
              createDataError(
                'UNSUPPORTED_CONVERSION',
                'DATA_UNSUPPORTED_FORMAT',
                `Conversion to format '${targetFormat}' not supported`,
                {
                  details: 'Use supported formats: json, csv',
                  context: { targetFormat },
                }
              )
            )
        }
      } catch (error) {
        return err(
          createDataError(
            'CONVERSION_FAILED',
            'DATA_CONVERSION_FAILED',
            `Format conversion to ${targetFormat} failed`,
            {
              details: String(error),
              context: { targetFormat, error },
            }
          )
        )
      }
    },
  }
}

// ========================================
// Default Instance Export
// ========================================

/**
 * Default data operations instance with standard configuration
 */
export const data = createUnifiedDataOperations({
  autoDetect: true,
  defaultFormat: 'json',
})
