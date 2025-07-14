import { ok, err } from '@esteban-url/core';
import { readFile } from '@esteban-url/fs';
import { Readable, Transform, Writable } from 'node:stream';
import * as Papa from 'papaparse';
import type {
  StreamResult,
  StreamOperations,
  StreamingCSVConfig,
  CreateCSVStreamingOperations,
} from './types.js';
import {
  defaultStreamingConfig,
  createProgressTracker,
  wrapStreamError,
  convertCoreErrorToError,
} from './utils.js';
import { createCSVError, mapLibraryError } from '../errors.js';
import { defaultCSVConfig } from '../csv/types.js';

// ========================================
// CSV Streaming Operations
// ========================================

export const createCSVStreamingOperations: CreateCSVStreamingOperations = (
  streamOps: StreamOperations,
  config = {}
) => {
  const csvStreamingConfig: StreamingCSVConfig = {
    ...defaultStreamingConfig,
    ...defaultCSVConfig,
    batchSize: 100,
    ...config,
  };

  const parseFileStream = async (
    filePath: string,
    options: StreamingCSVConfig = {}
  ): Promise<StreamResult<Readable>> => {
    try {
      const mergedOptions: StreamingCSVConfig = { ...csvStreamingConfig, ...options };

      // Read file content first
      const fileResult = await readFile()(filePath);
      if (fileResult.isErr()) {
        return err(fileResult.error);
      }

      return parseStringStream(fileResult.value, mergedOptions);
    } catch (error) {
      return err(wrapStreamError('parseFileStream', error));
    }
  };

  const parseStringStream = (
    data: string,
    options: StreamingCSVConfig = {}
  ): StreamResult<Readable> => {
    try {
      const mergedOptions: StreamingCSVConfig = { ...csvStreamingConfig, ...options };

      if (!data || data.trim().length === 0) {
        return err(createCSVError('Empty CSV data provided for streaming'));
      }

      const progressTracker = createProgressTracker();
      let rowIndex = 0;

      const stream = new Readable({
        objectMode: mergedOptions.objectMode,
        highWaterMark: mergedOptions.highWaterMark,
        read() {
          // Readable will be populated by Papa Parse step function
        },
      });

      // Use Papa Parse step function for streaming
      Papa.parse<any>(data, {
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
        step: (results, parser) => {
          rowIndex++;

          if (results.errors.length > 0 && !mergedOptions.errorTolerant) {
            const errorMessages = results.errors.map(e => e.message).join(', ');
            const error = createCSVError(
              'CSV parsing error during streaming',
              `Row ${rowIndex}: ${errorMessages}`,
              undefined,
              { rowIndex, errors: results.errors }
            );
            stream.emit('error', error);
            return;
          }

          // Push the row data to the stream
          if (!stream.push(results.data)) {
            parser.pause(); // Pause parsing if stream buffer is full
          }

          // Progress tracking
          progressTracker.increment();
          if (mergedOptions.onProgress) {
            mergedOptions.onProgress(progressTracker.getProgress().processed);
          }

          // Custom step handler
          if (mergedOptions.parseStep) {
            mergedOptions.parseStep(results, parser);
          }
        },
        complete: () => {
          stream.push(null); // End the stream
        },
        error: (error: any) => {
          const mappedError = mapLibraryError('Papa Parse', 'parseStringStream', error);
          stream.emit('error', mappedError);
        },
      });

      // Handle backpressure
      stream.on('drain', () => {
        // Resume parsing when stream is ready for more data
      });

      return ok(stream);
    } catch (error) {
      return err(wrapStreamError('parseStringStream', error));
    }
  };

  const writeFileStream = (
    filePath: string,
    options: StreamingCSVConfig = {}
  ): StreamResult<Writable> => {
    try {
      const mergedOptions: StreamingCSVConfig = { ...csvStreamingConfig, ...options };
      const progressTracker = createProgressTracker();
      let isFirstRow = true;
      let headers: string[] = [];

      const writeStream = new Transform({
        objectMode: mergedOptions.objectMode,
        highWaterMark: mergedOptions.highWaterMark,
        transform(chunk, encoding, callback) {
          try {
            let csvData = '';

            if (mergedOptions.hasHeader && isFirstRow) {
              // Extract headers from first row if it's an object
              if (typeof chunk === 'object' && chunk !== null) {
                headers = Object.keys(chunk);
                csvData =
                  Papa.unparse([headers], {
                    delimiter: mergedOptions.delimiter,
                    quotes: true,
                    quoteChar: mergedOptions.quoteChar,
                    escapeChar: mergedOptions.escapeChar,
                  }) + '\n';
              }
              isFirstRow = false;
            }

            // Convert chunk to CSV row
            let rowData;
            if (Array.isArray(chunk)) {
              rowData = chunk;
            } else if (typeof chunk === 'object' && chunk !== null) {
              rowData = headers.map(header => chunk[header] ?? '');
            } else {
              rowData = [chunk];
            }

            const csvRow = Papa.unparse([rowData], {
              delimiter: mergedOptions.delimiter,
              quotes: true,
              quoteChar: mergedOptions.quoteChar,
              escapeChar: mergedOptions.escapeChar,
              header: false,
            });

            csvData += csvRow + '\n';

            progressTracker.increment();
            if (mergedOptions.onProgress) {
              mergedOptions.onProgress(progressTracker.getProgress().processed);
            }

            callback(null, csvData);
          } catch (error) {
            callback(convertCoreErrorToError(wrapStreamError('writeFileStream transform', error)));
          }
        },
      });

      return ok(writeStream);
    } catch (error) {
      return err(wrapStreamError('writeFileStream', error));
    }
  };

  const transformStream = <T, U>(
    transform: (row: T) => U,
    options: StreamingCSVConfig = {}
  ): StreamResult<Transform> => {
    try {
      const mergedOptions: StreamingCSVConfig = { ...csvStreamingConfig, ...options };
      const progressTracker = createProgressTracker();

      const transformStream = new Transform({
        objectMode: mergedOptions.objectMode,
        highWaterMark: mergedOptions.highWaterMark,
        transform(chunk, encoding, callback) {
          try {
            const transformed = transform(chunk);

            progressTracker.increment();
            if (mergedOptions.onProgress) {
              mergedOptions.onProgress(progressTracker.getProgress().processed);
            }

            callback(null, transformed);
          } catch (error) {
            callback(convertCoreErrorToError(wrapStreamError('transformStream', error)));
          }
        },
      });

      return ok(transformStream);
    } catch (error) {
      return err(wrapStreamError('transformStream', error));
    }
  };

  const stringifyStream = (options: StreamingCSVConfig = {}): StreamResult<Transform> => {
    try {
      const mergedOptions: StreamingCSVConfig = { ...csvStreamingConfig, ...options };
      let isFirstChunk = true;

      const stringify = new Transform({
        objectMode: mergedOptions.objectMode,
        highWaterMark: mergedOptions.highWaterMark,
        transform(chunk, encoding, callback) {
          try {
            let csvData = '';

            if (
              isFirstChunk &&
              mergedOptions.hasHeader &&
              typeof chunk === 'object' &&
              chunk !== null
            ) {
              const headers = Array.isArray(chunk)
                ? chunk.map((_, i) => `column_${i}`)
                : Object.keys(chunk);
              csvData =
                Papa.unparse([headers], {
                  delimiter: mergedOptions.delimiter,
                  quotes: true,
                  quoteChar: mergedOptions.quoteChar,
                  escapeChar: mergedOptions.escapeChar,
                }) + '\n';
              isFirstChunk = false;
            }

            const rowData = Array.isArray(chunk)
              ? chunk
              : typeof chunk === 'object' && chunk !== null
                ? Object.values(chunk)
                : [chunk];

            const csvRow = Papa.unparse([rowData], {
              delimiter: mergedOptions.delimiter,
              quotes: true,
              quoteChar: mergedOptions.quoteChar,
              escapeChar: mergedOptions.escapeChar,
              header: false,
            });

            csvData += csvRow;
            callback(null, csvData);
          } catch (error) {
            callback(convertCoreErrorToError(wrapStreamError('stringifyStream', error)));
          }
        },
      });

      return ok(stringify);
    } catch (error) {
      return err(wrapStreamError('stringifyStream', error));
    }
  };

  const validateStream = (options: StreamingCSVConfig = {}): StreamResult<Transform> => {
    try {
      const mergedOptions: StreamingCSVConfig = { ...csvStreamingConfig, ...options };
      let rowIndex = 0;
      let errorCount = 0;

      const validator = new Transform({
        objectMode: mergedOptions.objectMode,
        highWaterMark: mergedOptions.highWaterMark,
        transform(chunk, encoding, callback) {
          rowIndex++;

          try {
            let isValid = true;
            let validationError: any = null;

            // Basic validation - ensure chunk is not null/undefined
            if (chunk === null || chunk === undefined) {
              errorCount++;
              isValid = false;
              validationError = createCSVError(
                'Invalid CSV row',
                `Row ${rowIndex}: null or undefined data`,
                undefined,
                { rowIndex, chunk }
              );

              if (mergedOptions.onError) {
                mergedOptions.onError(validationError, { rowIndex });
              }
            }

            // Pass through the chunk with validation metadata
            const validatedChunk = {
              data: chunk,
              rowIndex,
              isValid,
              errorCount,
              error: validationError,
            };

            callback(null, validatedChunk);
          } catch (error) {
            callback(convertCoreErrorToError(wrapStreamError('validateStream', error)));
          }
        },
      });

      return ok(validator);
    } catch (error) {
      return err(wrapStreamError('validateStream', error));
    }
  };

  return {
    parseFileStream,
    parseStringStream,
    writeFileStream,
    transformStream,
    stringifyStream,
    validateStream,
  };
};
