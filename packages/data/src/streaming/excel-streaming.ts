import { ok, err } from '@esteban-url/core'
import { readFile } from '@esteban-url/fs'
import { Readable, Transform, Writable } from 'node:stream'
import * as XLSX from 'xlsx'
import type {
  StreamResult,
  StreamOperations,
  StreamingExcelConfig,
  CreateExcelStreamingOperations,
} from './types.js'
import {
  defaultStreamingConfig,
  createProgressTracker,
  wrapStreamError,
  convertCoreErrorToError,
} from './utils.js'
import { createExcelError, mapLibraryError } from '../errors.js'
import { defaultExcelConfig } from '../excel/types.js'

// ========================================
// Excel Streaming Operations
// ========================================

export const createExcelStreamingOperations: CreateExcelStreamingOperations = (
  streamOps: StreamOperations,
  config = {}
) => {
  const excelStreamingConfig: StreamingExcelConfig = {
    ...defaultStreamingConfig,
    ...defaultExcelConfig,
    rowBatch: 100,
    ...config,
  }

  const parseFileStream = async (
    filePath: string,
    options: StreamingExcelConfig = {}
  ): Promise<StreamResult<Readable>> => {
    try {
      const mergedOptions: StreamingExcelConfig = { ...excelStreamingConfig, ...options }

      // Read file as buffer
      const fileResult = await readFile()(filePath)
      if (fileResult.isErr()) {
        return err(fileResult.error)
      }

      // Convert string to buffer for Excel processing
      const buffer = Buffer.from(fileResult.value, 'binary')
      return parseWorksheetStream(buffer, mergedOptions)
    } catch (error) {
      return err(wrapStreamError('parseFileStream', error))
    }
  }

  const parseWorksheetStream = (
    buffer: Buffer,
    options: StreamingExcelConfig = {}
  ): StreamResult<Readable> => {
    try {
      const mergedOptions: StreamingExcelConfig = { ...excelStreamingConfig, ...options }

      if (!buffer || buffer.length === 0) {
        return err(createExcelError('Empty Excel buffer provided for streaming'))
      }

      const progressTracker = createProgressTracker()
      let _rowIndex = 0

      const stream = new Readable({
        objectMode: mergedOptions.objectMode,
        highWaterMark: mergedOptions.highWaterMark,
        read() {
          // Will be populated by the parsing logic
        },
      })

      try {
        // Parse the Excel workbook
        const workbook = XLSX.read(buffer, {
          type: 'buffer',
          cellDates: mergedOptions.cellDates,
          cellStyles: false, // Disable for performance
          sheetStubs: false, // Disable for performance
        })

        // Determine which worksheet to process
        let worksheetName: string
        if (mergedOptions.worksheetName) {
          worksheetName = mergedOptions.worksheetName
          if (!workbook.Sheets[worksheetName]) {
            const error = createExcelError(
              'Worksheet not found',
              `Worksheet "${worksheetName}" does not exist in the workbook`,
              undefined,
              { worksheetName, availableSheets: workbook.SheetNames }
            )
            stream.emit('error', error)
            return ok(stream)
          }
        } else {
          const sheetIndex = mergedOptions.worksheetIndex ?? 0
          if (sheetIndex >= workbook.SheetNames.length) {
            const error = createExcelError(
              'Worksheet index out of range',
              `Index ${sheetIndex} exceeds available sheets (${workbook.SheetNames.length})`,
              undefined,
              { sheetIndex, sheetCount: workbook.SheetNames.length }
            )
            stream.emit('error', error)
            return ok(stream)
          }
          worksheetName = workbook.SheetNames[sheetIndex]
        }

        const worksheet = workbook.Sheets[worksheetName]

        // Get worksheet range
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1')
        const totalRows = range.e.r - range.s.r + 1
        progressTracker.getProgress().total = totalRows

        // Convert worksheet to array of objects or arrays
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: mergedOptions.hasHeader ? 1 : undefined,
          range: mergedOptions.range,
          defval: mergedOptions.defval,
          blankrows: false, // Skip blank rows for performance
          raw: !mergedOptions.dynamicTyping,
        })

        // Stream the data in batches
        const batchSize = mergedOptions.rowBatch || 100
        let currentIndex = 0

        const processNextBatch = () => {
          const endIndex = Math.min(currentIndex + batchSize, jsonData.length)

          for (let i = currentIndex; i < endIndex; i++) {
            const row = jsonData[i]
            _rowIndex++

            if (!stream.push(row)) {
              // Backpressure - pause processing
              currentIndex = i + 1
              stream.once('drain', processNextBatch)
              return
            }

            progressTracker.increment()
            if (mergedOptions.onProgress) {
              mergedOptions.onProgress(progressTracker.getProgress().processed, totalRows)
            }
          }

          currentIndex = endIndex

          if (currentIndex >= jsonData.length) {
            stream.push(null) // End the stream
          } else {
            // Continue with next batch on next tick
            setImmediate(processNextBatch)
          }
        }

        // Start processing
        setImmediate(processNextBatch)
      } catch (xlsxError) {
        const mappedError = mapLibraryError('XLSX', 'parseWorksheetStream', xlsxError)
        stream.emit('error', mappedError)
      }

      return ok(stream)
    } catch (error) {
      return err(wrapStreamError('parseWorksheetStream', error))
    }
  }

  const writeFileStream = (
    filePath: string,
    options: StreamingExcelConfig = {}
  ): StreamResult<Writable> => {
    try {
      const mergedOptions: StreamingExcelConfig = { ...excelStreamingConfig, ...options }
      const progressTracker = createProgressTracker()
      const rows: any[] = []
      let headers: string[] = []
      let isFirstRow = true

      const writeStream = new Transform({
        objectMode: mergedOptions.objectMode,
        highWaterMark: mergedOptions.highWaterMark,
        transform(chunk, encoding, callback) {
          try {
            // Collect headers from first row if it's an object
            if (
              mergedOptions.hasHeader &&
              isFirstRow &&
              typeof chunk === 'object' &&
              chunk !== null
            ) {
              headers = Object.keys(chunk)
              isFirstRow = false
            }

            // Store the row data
            rows.push(chunk)

            progressTracker.increment()
            if (mergedOptions.onProgress) {
              mergedOptions.onProgress(progressTracker.getProgress().processed)
            }

            callback(null, chunk) // Pass through for further processing if needed
          } catch (error) {
            callback(convertCoreErrorToError(wrapStreamError('writeFileStream transform', error)))
          }
        },
        flush(callback) {
          try {
            // Create worksheet from collected rows
            let worksheet: XLSX.WorkSheet

            if (headers.length > 0) {
              // Convert objects to worksheet
              worksheet = XLSX.utils.json_to_sheet(rows, {
                header: headers,
                dateNF: mergedOptions.dateNF,
              })
            } else {
              // Convert arrays to worksheet
              worksheet = XLSX.utils.aoa_to_sheet(rows)
            }

            // Apply range if specified
            if (mergedOptions.range) {
              worksheet['!ref'] = mergedOptions.range
            }

            // Create workbook and add worksheet
            const workbook = XLSX.utils.book_new()
            const sheetName = mergedOptions.worksheetName || 'Sheet1'
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

            // Write to buffer
            const buffer = XLSX.write(workbook, {
              type: 'buffer',
              bookType: 'xlsx',
              cellDates: mergedOptions.cellDates,
            })

            callback(null, buffer)
          } catch (error) {
            callback(convertCoreErrorToError(wrapStreamError('writeFileStream flush', error)))
          }
        },
      })

      return ok(writeStream)
    } catch (error) {
      return err(wrapStreamError('writeFileStream', error))
    }
  }

  const transformRowStream = <T, U>(
    transform: (row: T) => U,
    options: StreamingExcelConfig = {}
  ): StreamResult<Transform> => {
    try {
      const mergedOptions: StreamingExcelConfig = { ...excelStreamingConfig, ...options }
      const progressTracker = createProgressTracker()

      const transformStream = new Transform({
        objectMode: mergedOptions.objectMode,
        highWaterMark: mergedOptions.highWaterMark,
        transform(chunk, encoding, callback) {
          try {
            const transformed = transform(chunk)

            progressTracker.increment()
            if (mergedOptions.onProgress) {
              mergedOptions.onProgress(progressTracker.getProgress().processed)
            }

            callback(null, transformed)
          } catch (error) {
            callback(convertCoreErrorToError(wrapStreamError('transformRowStream', error)))
          }
        },
      })

      return ok(transformStream)
    } catch (error) {
      return err(wrapStreamError('transformRowStream', error))
    }
  }

  const stringifyWorksheetStream = (
    options: StreamingExcelConfig = {}
  ): StreamResult<Transform> => {
    try {
      const mergedOptions: StreamingExcelConfig = { ...excelStreamingConfig, ...options }
      const rows: any[] = []

      const stringify = new Transform({
        objectMode: mergedOptions.objectMode,
        highWaterMark: mergedOptions.highWaterMark,
        transform(chunk, encoding, callback) {
          try {
            rows.push(chunk)
            callback(null, chunk) // Pass through
          } catch (error) {
            callback(convertCoreErrorToError(wrapStreamError('stringifyWorksheetStream', error)))
          }
        },
        flush(callback) {
          try {
            // Create worksheet from collected rows
            const worksheet = XLSX.utils.json_to_sheet(rows, {
              dateNF: mergedOptions.dateNF,
            })

            // Create workbook
            const workbook = XLSX.utils.book_new()
            const sheetName = mergedOptions.worksheetName || 'Sheet1'
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

            // Convert to buffer
            const buffer = XLSX.write(workbook, {
              type: 'buffer',
              bookType: 'xlsx',
              cellDates: mergedOptions.cellDates,
            })

            callback(null, buffer)
          } catch (error) {
            callback(
              convertCoreErrorToError(wrapStreamError('stringifyWorksheetStream flush', error))
            )
          }
        },
      })

      return ok(stringify)
    } catch (error) {
      return err(wrapStreamError('stringifyWorksheetStream', error))
    }
  }

  return {
    parseFileStream,
    parseWorksheetStream,
    writeFileStream,
    transformRowStream,
    stringifyWorksheetStream,
  }
}
