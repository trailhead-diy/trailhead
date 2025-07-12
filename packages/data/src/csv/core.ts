import { ok, err } from '@trailhead/core';
import { readFile, writeFile } from '@trailhead/fs';
import * as Papa from 'papaparse';
import type { CSVProcessingOptions, DataResult, CSVFormatInfo } from '../types.js';
import type { CreateCSVOperations } from './types.js';
import { defaultCSVConfig } from './types.js';
import { createCSVError, createParsingError, mapLibraryError } from '../errors.js';

// ========================================
// CSV Core Operations
// ========================================

export const createCSVOperations: CreateCSVOperations = (config = {}) => {
  const csvConfig = { ...defaultCSVConfig, ...config };

  const parseString = (
    inputData: string,
    options: CSVProcessingOptions = {}
  ): DataResult<any[]> => {
    try {
      const mergedOptions = { ...csvConfig, ...options };

      if (!inputData || inputData.trim().length === 0) {
        return err(createCSVError('Empty CSV data provided'));
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
      });

      if (parseResult.errors.length > 0 && !mergedOptions.errorTolerant) {
        const errorMessages = parseResult.errors.map(e => e.message).join(', ');
        return err(
          createParsingError('CSV parsing failed', `Errors: ${errorMessages}`, parseResult.errors, {
            errors: parseResult.errors,
          })
        );
      }

      const parsedData = parseResult.data as any[];

      if (mergedOptions.maxRows && parsedData.length > mergedOptions.maxRows) {
        return err(
          createCSVError(
            'Row limit exceeded',
            `Found ${parsedData.length} rows, maximum allowed: ${mergedOptions.maxRows}`,
            undefined,
            { rowCount: parsedData.length, maxRows: mergedOptions.maxRows }
          )
        );
      }

      return ok(parsedData);
    } catch (error) {
      return err(mapLibraryError('Papa Parse', 'parseString', error));
    }
  };

  const parseFile = async (
    filePath: string,
    options: CSVProcessingOptions = {}
  ): Promise<DataResult<any[]>> => {
    const fileResult = await readFile()(filePath);
    if (fileResult.isErr()) {
      return err(fileResult.error);
    }

    return parseString(fileResult.value, options);
  };

  const stringify = (data: any[], options: CSVProcessingOptions = {}): DataResult<string> => {
    try {
      const mergedOptions = { ...csvConfig, ...options };

      if (!Array.isArray(data)) {
        return err(createCSVError('Data must be an array'));
      }

      if (data.length === 0) {
        return ok('');
      }

      const csvString = Papa.unparse(data, {
        delimiter: mergedOptions.delimiter,
        quotes: true,
        quoteChar: mergedOptions.quoteChar,
        escapeChar: mergedOptions.escapeChar,
        header: mergedOptions.hasHeader,
        skipEmptyLines: mergedOptions.skipEmptyLines,
      });

      return ok(csvString);
    } catch (error) {
      return err(mapLibraryError('Papa Parse', 'stringify', error));
    }
  };

  const writeFileOperation = async (
    data: any[],
    filePath: string,
    options: CSVProcessingOptions = {}
  ): Promise<DataResult<void>> => {
    const stringifyResult = stringify(data, options);
    if (stringifyResult.isErr()) {
      return err(stringifyResult.error);
    }

    return await writeFile()(stringifyResult.value, filePath);
  };

  const validate = (data: string): DataResult<boolean> => {
    try {
      if (!data || data.trim().length === 0) {
        return ok(false);
      }

      const parseResult = Papa.parse(data, {
        header: false,
        skipEmptyLines: true,
        preview: 1, // Only parse first row for validation
      });

      const isValid = parseResult.errors.length === 0 && parseResult.data.length > 0;
      return ok(isValid);
    } catch (error) {
      return err(mapLibraryError('Papa Parse', 'validate', error));
    }
  };

  const detectFormat = (data: string): DataResult<CSVFormatInfo> => {
    try {
      if (!data || data.trim().length === 0) {
        return err(createCSVError('Empty data provided for format detection'));
      }

      const delimiters = [',', ';', '\t', '|'];
      let bestDelimiter = ',';
      let maxColumns = 0;
      let detectedQuoteChar = '"';

      for (const delimiter of delimiters) {
        const parseResult = Papa.parse(data, {
          delimiter,
          preview: 5, // Parse only first 5 rows
          skipEmptyLines: true,
        });

        if (parseResult.data.length > 0) {
          const row = parseResult.data[0] as any[];
          if (row.length > maxColumns) {
            maxColumns = row.length;
            bestDelimiter = delimiter;
          }
        }
      }

      // Detect if data has headers by checking if first row contains non-numeric values
      const headerCheckResult = Papa.parse(data, {
        delimiter: bestDelimiter,
        preview: 2,
        skipEmptyLines: true,
      });

      let hasHeader = false;
      if (headerCheckResult.data.length >= 2) {
        const firstRow = headerCheckResult.data[0] as any[];
        const secondRow = headerCheckResult.data[1] as any[];

        hasHeader = firstRow.some((value, index) => {
          const firstValue = String(value);
          const secondValue = String(secondRow[index] || '');
          return isNaN(Number(firstValue)) && !isNaN(Number(secondValue));
        });
      }

      // Count total rows and columns
      const fullParseResult = Papa.parse(data, {
        delimiter: bestDelimiter,
        skipEmptyLines: true,
      });

      const rowCount = fullParseResult.data.length;
      const columnCount = rowCount > 0 ? (fullParseResult.data[0] as any[]).length : 0;

      return ok({
        delimiter: bestDelimiter,
        quoteChar: detectedQuoteChar,
        hasHeader,
        rowCount,
        columnCount,
      });
    } catch (error) {
      return err(mapLibraryError('Papa Parse', 'detectFormat', error));
    }
  };

  const parseToObjects = (
    data: string,
    options: CSVProcessingOptions = {}
  ): DataResult<Record<string, any>[]> => {
    const mergedOptions = { ...options, hasHeader: true };
    return parseString(data, mergedOptions) as DataResult<Record<string, any>[]>;
  };

  const parseToArrays = (
    data: string,
    options: CSVProcessingOptions = {}
  ): DataResult<string[][]> => {
    const mergedOptions = { ...options, hasHeader: false };
    return parseString(data, mergedOptions) as DataResult<string[][]>;
  };

  const fromObjects = (
    objects: Record<string, any>[],
    options: CSVProcessingOptions = {}
  ): DataResult<string> => {
    const mergedOptions = { ...options, hasHeader: true };
    return stringify(objects, mergedOptions);
  };

  const fromArrays = (
    arrays: string[][],
    options: CSVProcessingOptions = {}
  ): DataResult<string> => {
    const mergedOptions = { ...options, hasHeader: false };
    return stringify(arrays, mergedOptions);
  };

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
  };
};
