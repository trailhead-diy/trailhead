import { ok, err } from '@trailhead/core';
import { readFile, writeFile } from '@trailhead/fs';
import type { JSONProcessingOptions, DataResult } from '../types.js';
import type { CreateJSONOperations, JSONFormatOptions } from './types.js';
import { defaultJSONConfig } from './types.js';
import { createJSONError, createParsingError, mapLibraryError } from '../errors.js';

// ========================================
// JSON Core Operations
// ========================================

export const createJSONOperations: CreateJSONOperations = (config = {}) => {
  const jsonConfig = { ...defaultJSONConfig, ...config };

  const parseString = (data: string, options: JSONProcessingOptions = {}): DataResult<any> => {
    try {
      const mergedOptions = { ...jsonConfig, ...options };

      if (!data || data.trim().length === 0) {
        return err(createJSONError('Empty JSON data provided'));
      }

      let processedData = data;

      // Handle trailing commas if allowed
      if (mergedOptions.allowTrailingCommas) {
        processedData = processedData.replace(/,(\s*[}\]])/g, '$1');
      }

      // Handle comments if allowed
      if (mergedOptions.allowComments) {
        // Remove single-line comments
        processedData = processedData.replace(/\/\/.*$/gm, '');
        // Remove multi-line comments
        processedData = processedData.replace(/\/\*[\s\S]*?\*\//g, '');
      }

      const parsed = JSON.parse(processedData, mergedOptions.reviver);
      return ok(parsed);
    } catch (error) {
      if (error instanceof SyntaxError) {
        return err(
          createParsingError(
            'JSON parsing failed',
            `Invalid JSON syntax: ${error.message}`,
            error,
            { originalData: data.substring(0, 100) + '...' }
          )
        );
      }
      return err(mapLibraryError('JSON', 'parseString', error));
    }
  };

  const parseFile = async (
    filePath: string,
    options: JSONProcessingOptions = {}
  ): Promise<DataResult<any>> => {
    const fileResult = await readFile()(filePath);
    if (fileResult.isErr()) {
      return err(fileResult.error);
    }

    return parseString(fileResult.value, options);
  };

  const stringify = (data: any, options: JSONProcessingOptions = {}): DataResult<string> => {
    try {
      const mergedOptions = { ...jsonConfig, ...options };

      if (data === undefined) {
        return err(createJSONError('Cannot stringify undefined value'));
      }

      const jsonString = JSON.stringify(data, mergedOptions.replacer, mergedOptions.space);

      if (jsonString === undefined) {
        return err(
          createJSONError('Stringify returned undefined - data contains non-serializable values')
        );
      }

      return ok(jsonString);
    } catch (error) {
      if (error instanceof TypeError) {
        return err(
          createJSONError('JSON stringify failed', `Cannot serialize data: ${error.message}`, error)
        );
      }
      return err(mapLibraryError('JSON', 'stringify', error));
    }
  };

  const writeFileOperation = async (
    data: any,
    filePath: string,
    options: JSONProcessingOptions = {}
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

      JSON.parse(data);
      return ok(true);
    } catch (error) {
      return ok(false);
    }
  };

  const minify = (data: string): DataResult<string> => {
    const parseResult = parseString(data);
    if (parseResult.isErr()) {
      return err(parseResult.error);
    }

    return stringify(parseResult.value);
  };

  const format = (data: string, options: JSONFormatOptions = {}): DataResult<string> => {
    const parseResult = parseString(data);
    if (parseResult.isErr()) {
      return err(parseResult.error);
    }

    let formatOptions: JSONProcessingOptions = {
      space: options.indent ?? 2,
    };

    if (options.sortKeys) {
      const sortKeysReplacer = (key: string, value: any) => {
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          const sortedObject: Record<string, any> = {};
          Object.keys(value)
            .sort()
            .forEach(sortedKey => {
              sortedObject[sortedKey] = value[sortedKey];
            });
          return sortedObject;
        }
        return value;
      };

      formatOptions = { ...formatOptions, replacer: sortKeysReplacer };
    }

    return stringify(parseResult.value, formatOptions);
  };

  return {
    parseString,
    parseFile,
    stringify,
    writeFile: writeFileOperation,
    validate,
    minify,
    format,
  };
};
