import { ok, err } from '@trailhead/core'
import { readFile, writeFile } from '@trailhead/fs'
import * as Papa from 'papaparse'
import type {
  CSVProcessingOptions,
  DataResult,
  CSVFormatInfo,
  ParsedData,
  ParseMetadata,
  ParseError,
} from '../types.js'
import { defaultCSVConfig, type CreateCSVOperations } from './types.js'
import {
  createCSVError,
  createParsingError,
  mapLibraryError,
  mapFileSystemError,
} from '../errors.js'

// ========================================
// CSV Core Operations
// ========================================

/**
 * Create CSV operations with custom configuration
 * @param {CSVConfig} [config={}] - CSV configuration options
 * @returns {CSVOperations} Configured CSV operations object
 *
 * @example Basic usage
 * ```typescript
 * const csvOps = createCSVOperations()
 * const result = await csvOps.parseFile('data.csv')
 * ```
 *
 * @example Custom configuration
 * ```typescript
 * const csvOps = createCSVOperations({
 *   delimiter: ';',
 *   hasHeader: true,
 *   dynamicTyping: true
 * })
 * ```
 */
export const createCSVOperations: CreateCSVOperations = (config = {}) => {
  const csvConfig = { ...defaultCSVConfig, ...config }

  const parseString = <T = Record<string, unknown>>(
    inputData: string,
    options: CSVProcessingOptions = {}
  ): DataResult<ParsedData<T>> => {
    try {
      const mergedOptions = { ...csvConfig, ...options }

      if (!inputData || inputData.trim().length === 0) {
        return err(createCSVError('Empty CSV data provided', {}))
      }

      const parseResult = Papa.parse(inputData, {
        delimiter: mergedOptions.delimiter,
        quoteChar: mergedOptions.quoteChar,
        escapeChar: mergedOptions.escapeChar,
        header: mergedOptions.hasHeader,
        dynamicTyping: mergedOptions.dynamicTyping,
        skipEmptyLines: mergedOptions.skipEmptyLines,
        comments: mergedOptions.comments || undefined,
        transform: mergedOptions.transform,
        transformHeader: mergedOptions.transformHeader,
        delimitersToGuess: mergedOptions.detectDelimiter ? [',', ';', '\t', '|'] : undefined,
      })

      if (parseResult.errors.length > 0 && !mergedOptions.errorTolerant) {
        const errorMessages = parseResult.errors.map((e) => e.message).join(', ')
        return err(
          createParsingError('CSV parsing failed', {
            details: `Errors: ${errorMessages}`,
            cause: parseResult.errors,
            context: { errors: parseResult.errors },
          })
        )
      }

      // Type-safe data extraction from Papa Parse result
      // Papa Parse returns unknown[], we validate and cast safely
      const rawData = parseResult.data as unknown[]

      // Runtime validation of data structure
      if (!Array.isArray(rawData)) {
        return err(
          createParsingError('Invalid parse result', {
            details: 'Papa Parse returned non-array data',
            context: { receivedType: typeof rawData },
          })
        )
      }

      if (mergedOptions.maxRows && rawData.length > mergedOptions.maxRows) {
        return err(
          createCSVError('Row limit exceeded', {
            details: `Found ${rawData.length} rows, maximum allowed: ${mergedOptions.maxRows}`,
            context: { rowCount: rawData.length, maxRows: mergedOptions.maxRows },
          })
        )
      }

      // Convert Papa Parse data to type-safe format
      const typedData: T[] = rawData.map((row, index) => {
        // Basic validation that row is an object-like structure
        if (row === null || row === undefined) {
          throw new Error(`Invalid row at index ${index}: null/undefined`)
        }
        return row as T
      })

      // Create metadata from parse result
      const metadata: ParseMetadata = {
        totalRows: typedData.length,
        format: 'csv',
        hasHeaders: mergedOptions.hasHeader ?? false,
        encoding: mergedOptions.encoding,
      }

      // Convert Papa Parse errors to our ParseError format
      const parseErrors: ParseError[] = parseResult.errors.map((error: any) => ({
        type: 'CSVParseError',
        code: error.code || 'UNKNOWN',
        message: error.message || 'Unknown parsing error',
        row: error.row,
        column: error.col, // Papa Parse uses 'col' not 'column'
      }))

      const parsedData: ParsedData<T> = {
        data: typedData,
        metadata,
        errors: parseErrors,
      }

      return ok(parsedData)
    } catch (error) {
      return err(mapLibraryError('Papa Parse', 'parseString', error))
    }
  }

  const parseFile = async <T = Record<string, unknown>>(
    filePath: string,
    options: CSVProcessingOptions = {}
  ): Promise<DataResult<ParsedData<T>>> => {
    const fileResult = await readFile()(filePath)
    if (fileResult.isErr()) {
      return err(mapFileSystemError(fileResult.error, 'parseFile'))
    }

    return parseString<T>(fileResult.value, options)
  }

  const stringify = <T = Record<string, unknown>>(
    data: readonly T[],
    options: CSVProcessingOptions = {}
  ): DataResult<string> => {
    try {
      const mergedOptions = { ...csvConfig, ...options }

      if (!Array.isArray(data)) {
        return err(createCSVError('Data must be an array', {}))
      }

      if (data.length === 0) {
        return ok('')
      }

      const csvString = Papa.unparse(data as unknown[], {
        delimiter: mergedOptions.delimiter,
        quotes: true,
        quoteChar: mergedOptions.quoteChar,
        escapeChar: mergedOptions.escapeChar,
        header: mergedOptions.hasHeader,
        skipEmptyLines: mergedOptions.skipEmptyLines,
      })

      return ok(csvString)
    } catch (error) {
      return err(mapLibraryError('Papa Parse', 'stringify', error))
    }
  }

  const writeFileOperation = async <T = Record<string, unknown>>(
    data: readonly T[],
    filePath: string,
    options: CSVProcessingOptions = {}
  ): Promise<DataResult<void>> => {
    const stringifyResult = stringify(data, options)
    if (stringifyResult.isErr()) {
      return err(stringifyResult.error)
    }

    const writeResult = await writeFile()(stringifyResult.value, filePath)
    if (writeResult.isErr()) {
      return err(mapFileSystemError(writeResult.error, 'writeFile'))
    }
    return writeResult
  }

  const validate = (data: string): DataResult<boolean> => {
    try {
      if (!data || data.trim().length === 0) {
        return ok(false)
      }

      const parseResult = Papa.parse(data, {
        header: false,
        skipEmptyLines: true,
        preview: 1, // Only parse first row for validation
      })

      const isValid = parseResult.errors.length === 0 && parseResult.data.length > 0
      return ok(isValid)
    } catch (error) {
      return err(mapLibraryError('Papa Parse', 'validate', error))
    }
  }

  const detectFormat = (data: string): DataResult<CSVFormatInfo> => {
    try {
      if (!data || data.trim().length === 0) {
        return err(createCSVError('Empty data provided for format detection', {}))
      }

      const delimiters = [',', ';', '\t', '|']
      let bestDelimiter = ','
      let maxColumns = 0
      let detectedQuoteChar = '"'

      for (const delimiter of delimiters) {
        const parseResult = Papa.parse(data, {
          delimiter,
          preview: 5, // Parse only first 5 rows
          skipEmptyLines: true,
        })

        if (parseResult.data.length > 0) {
          const row = parseResult.data[0] as unknown
          if (Array.isArray(row) && row.length > maxColumns) {
            maxColumns = row.length
            bestDelimiter = delimiter
          }
        }
      }

      // Detect if data has headers by checking if first row contains non-numeric values
      const headerCheckResult = Papa.parse(data, {
        delimiter: bestDelimiter,
        preview: 2,
        skipEmptyLines: true,
      })

      let hasHeader = false
      if (headerCheckResult.data.length >= 2) {
        const firstRow = headerCheckResult.data[0] as unknown
        const secondRow = headerCheckResult.data[1] as unknown

        if (Array.isArray(firstRow) && Array.isArray(secondRow)) {
          hasHeader = firstRow.some((value, index) => {
            const firstValue = String(value)
            const secondValue = String(secondRow[index] || '')
            return isNaN(Number(firstValue)) && !isNaN(Number(secondValue))
          })
        }
      }

      // Count total rows and columns
      const fullParseResult = Papa.parse(data, {
        delimiter: bestDelimiter,
        skipEmptyLines: true,
      })

      const rowCount = fullParseResult.data.length
      const columnCount =
        rowCount > 0 && Array.isArray(fullParseResult.data[0])
          ? (fullParseResult.data[0] as unknown[]).length
          : 0

      return ok({
        delimiter: bestDelimiter,
        quoteChar: detectedQuoteChar,
        hasHeader,
        rowCount,
        columnCount,
      })
    } catch (error) {
      return err(mapLibraryError('Papa Parse', 'detectFormat', error))
    }
  }

  const parseToObjects = (
    data: string,
    options: CSVProcessingOptions = {}
  ): DataResult<ParsedData<Record<string, unknown>>> => {
    const mergedOptions = { ...options, hasHeader: true }
    return parseString<Record<string, unknown>>(data, mergedOptions)
  }

  const parseToArrays = (
    data: string,
    options: CSVProcessingOptions = {}
  ): DataResult<ParsedData<readonly string[]>> => {
    const mergedOptions = { ...options, hasHeader: false }
    return parseString<readonly string[]>(data, mergedOptions)
  }

  const fromObjects = (
    objects: readonly Record<string, unknown>[],
    options: CSVProcessingOptions = {}
  ): DataResult<string> => {
    const mergedOptions = { ...options, hasHeader: true }
    return stringify(objects, mergedOptions)
  }

  const fromArrays = (
    arrays: readonly (readonly string[])[],
    options: CSVProcessingOptions = {}
  ): DataResult<string> => {
    const mergedOptions = { ...options, hasHeader: false }
    return stringify(arrays, mergedOptions)
  }

  return {
    parseString,
    parseFile,
    stringify,
    writeFile: writeFileOperation,
    validate,
    detectFormat,
    parseToObjects,
    parseToArrays,
    fromObjects,
    fromArrays,
  }
}
