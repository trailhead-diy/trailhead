import { ok, err } from '@esteban-url/core'
import { readFile } from '@esteban-url/fs'
import { Readable, Transform, Writable } from 'node:stream'
import type {
  StreamResult,
  StreamOperations,
  StreamingJSONConfig,
  CreateJSONStreamingOperations,
} from './types.js'
import {
  defaultStreamingConfig,
  createProgressTracker,
  wrapStreamError,
  convertCoreErrorToError,
} from './utils.js'
import { createJSONError } from '../errors.js'
import { defaultJSONConfig } from '../json/types.js'

// ========================================
// JSON Streaming Operations
// ========================================

export const createJSONStreamingOperations: CreateJSONStreamingOperations = (
  streamOps: StreamOperations,
  config = {}
) => {
  const jsonStreamingConfig: StreamingJSONConfig = {
    ...defaultStreamingConfig,
    ...defaultJSONConfig,
    streamArray: true,
    arrayPath: '$',
    ...config,
  }

  const parseFileStream = async (
    filePath: string,
    options: StreamingJSONConfig = {}
  ): Promise<StreamResult<Readable>> => {
    try {
      const mergedOptions: StreamingJSONConfig = { ...jsonStreamingConfig, ...options }

      // Read file content first
      const fileResult = await readFile()(filePath)
      if (fileResult.isErr()) {
        return err(fileResult.error)
      }

      return parseArrayStream(fileResult.value, mergedOptions)
    } catch (error) {
      return err(wrapStreamError('parseFileStream', error))
    }
  }

  const parseArrayStream = (
    data: string,
    options: StreamingJSONConfig = {}
  ): StreamResult<Readable> => {
    try {
      const mergedOptions: StreamingJSONConfig = { ...jsonStreamingConfig, ...options }

      if (!data || data.trim().length === 0) {
        return err(createJSONError('Empty JSON data provided for streaming'))
      }

      const progressTracker = createProgressTracker()
      let itemIndex = 0

      const stream = new Readable({
        objectMode: mergedOptions.objectMode,
        highWaterMark: mergedOptions.highWaterMark,
        read() {
          // Will be populated by the parsing logic
        },
      })

      // Parse JSON to determine if it's an array or single object
      let jsonData: any
      try {
        jsonData = JSON.parse(data, mergedOptions.reviver)
      } catch (parseError) {
        const error = createJSONError(
          'Invalid JSON data for streaming',
          `JSON parsing failed: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
          undefined,
          { parseError }
        )
        stream.emit('error', error)
        return ok(stream)
      }

      // Handle array streaming
      if (Array.isArray(jsonData)) {
        const processNextItem = () => {
          if (itemIndex < jsonData.length) {
            const item = jsonData[itemIndex]
            itemIndex++

            if (!stream.push(item)) {
              // Backpressure - pause processing
              stream.once('drain', processNextItem)
              return
            }

            progressTracker.increment()
            if (mergedOptions.onProgress) {
              mergedOptions.onProgress(progressTracker.getProgress().processed, jsonData.length)
            }

            // Continue with next item on next tick
            setImmediate(processNextItem)
          } else {
            stream.push(null) // End the stream
          }
        }

        // Start processing
        setImmediate(processNextItem)
      } else {
        // Single object - emit as single item
        stream.push(jsonData)
        stream.push(null)

        progressTracker.increment()
        if (mergedOptions.onProgress) {
          mergedOptions.onProgress(1, 1)
        }
      }

      return ok(stream)
    } catch (error) {
      return err(wrapStreamError('parseArrayStream', error))
    }
  }

  const writeFileStream = (
    filePath: string,
    options: StreamingJSONConfig = {}
  ): StreamResult<Writable> => {
    try {
      const mergedOptions: StreamingJSONConfig = { ...jsonStreamingConfig, ...options }
      const progressTracker = createProgressTracker()
      let isFirstItem = true
      let _itemCount = 0

      const writeStream = new Transform({
        objectMode: mergedOptions.objectMode,
        highWaterMark: mergedOptions.highWaterMark,
        transform(chunk, encoding, callback) {
          try {
            let jsonData = ''

            if (isFirstItem) {
              // Start JSON array
              jsonData = mergedOptions.streamArray ? '[\n' : ''
              isFirstItem = false
            } else if (mergedOptions.streamArray) {
              // Add comma separator for array items
              jsonData = ',\n'
            }

            // Stringify the chunk
            const itemJson = JSON.stringify(chunk, mergedOptions.replacer, mergedOptions.space)
            jsonData += mergedOptions.space ? `  ${itemJson}` : itemJson

            _itemCount++
            progressTracker.increment()
            if (mergedOptions.onProgress) {
              mergedOptions.onProgress(progressTracker.getProgress().processed)
            }

            callback(null, jsonData)
          } catch (error) {
            callback(convertCoreErrorToError(wrapStreamError('writeFileStream transform', error)))
          }
        },
        flush(callback) {
          try {
            // Close JSON array if streaming array
            const endData = mergedOptions.streamArray ? '\n]' : ''
            callback(null, endData)
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

  const stringifyArrayStream = (options: StreamingJSONConfig = {}): StreamResult<Transform> => {
    try {
      const mergedOptions: StreamingJSONConfig = { ...jsonStreamingConfig, ...options }
      let isFirstItem = true

      const stringify = new Transform({
        objectMode: mergedOptions.objectMode,
        highWaterMark: mergedOptions.highWaterMark,
        transform(chunk, encoding, callback) {
          try {
            let jsonData = ''

            if (isFirstItem) {
              jsonData = mergedOptions.streamArray ? '[\n' : ''
              isFirstItem = false
            } else if (mergedOptions.streamArray) {
              jsonData = ',\n'
            }

            const itemJson = JSON.stringify(chunk, mergedOptions.replacer, mergedOptions.space)
            jsonData += mergedOptions.space ? `  ${itemJson}` : itemJson

            callback(null, jsonData)
          } catch (error) {
            callback(convertCoreErrorToError(wrapStreamError('stringifyArrayStream', error)))
          }
        },
        flush(callback) {
          try {
            const endData = mergedOptions.streamArray ? '\n]' : ''
            callback(null, endData)
          } catch (error) {
            callback(convertCoreErrorToError(wrapStreamError('stringifyArrayStream flush', error)))
          }
        },
      })

      return ok(stringify)
    } catch (error) {
      return err(wrapStreamError('stringifyArrayStream', error))
    }
  }

  const transformStream = <T, U>(
    transform: (item: T) => U,
    options: StreamingJSONConfig = {}
  ): StreamResult<Transform> => {
    try {
      const mergedOptions: StreamingJSONConfig = { ...jsonStreamingConfig, ...options }
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
            callback(convertCoreErrorToError(wrapStreamError('transformStream', error)))
          }
        },
      })

      return ok(transformStream)
    } catch (error) {
      return err(wrapStreamError('transformStream', error))
    }
  }

  const validateStream = (options: StreamingJSONConfig = {}): StreamResult<Transform> => {
    try {
      const mergedOptions: StreamingJSONConfig = { ...jsonStreamingConfig, ...options }
      let itemIndex = 0
      let errorCount = 0

      const validator = new Transform({
        objectMode: mergedOptions.objectMode,
        highWaterMark: mergedOptions.highWaterMark,
        transform(chunk, encoding, callback) {
          itemIndex++

          try {
            let isValid = true
            let validationError: any = null

            // Basic validation - ensure chunk can be serialized to JSON
            try {
              JSON.stringify(chunk)
            } catch (serializeError) {
              isValid = false
              errorCount++
              validationError = createJSONError(
                'Invalid JSON item',
                `Item ${itemIndex}: cannot serialize to JSON`,
                undefined,
                { itemIndex, chunk, serializeError }
              )

              if (mergedOptions.onError) {
                mergedOptions.onError(validationError, { itemIndex })
              }
            }

            // Pass through the chunk with validation metadata
            const validatedChunk = {
              data: chunk,
              itemIndex,
              isValid,
              errorCount,
              error: validationError,
            }

            callback(null, validatedChunk)
          } catch (error) {
            callback(convertCoreErrorToError(wrapStreamError('validateStream', error)))
          }
        },
      })

      return ok(validator)
    } catch (error) {
      return err(wrapStreamError('validateStream', error))
    }
  }

  return {
    parseFileStream,
    parseArrayStream,
    writeFileStream,
    stringifyArrayStream,
    transformStream,
    validateStream,
  }
}
