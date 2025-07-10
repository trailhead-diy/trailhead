import JSON5 from 'json5';
import { readFile, writeFile } from 'fs/promises';
import { merge, get, set, unset } from 'lodash';
import equal from 'fast-deep-equal';
import { flatten, unflatten } from 'flat';
import type { Result } from '../core/errors/types.js';
import type { CLIError } from '../core/errors/types.js';
import { Ok, Err, createError, fileSystemError } from '../core/errors/factory.js';
import type { JSONProcessor, JSONProcessingOptions } from './types.js';

const defaultOptions: JSONProcessingOptions = {
  allowTrailingCommas: false,
  allowComments: false,
  allowSingleQuotes: false,
  allowUnquotedKeys: false,
  autoTrim: true,
  skipEmptyLines: true,
  errorTolerant: false,
};

const shouldUseJSON5 = (options: JSONProcessingOptions): boolean =>
  Boolean(
    options.allowTrailingCommas ||
      options.allowComments ||
      options.allowSingleQuotes ||
      options.allowUnquotedKeys
  );

const parseString = (data: string, options?: JSONProcessingOptions): Result<any, CLIError> => {
  const opts = { ...defaultOptions, ...options };

  try {
    let processedData = data;

    if (opts.autoTrim) {
      processedData = processedData.trim();
    }

    if (shouldUseJSON5(opts)) {
      const result = JSON5.parse(processedData, opts.reviver);
      return Ok(result);
    } else {
      const result = JSON.parse(processedData, opts.reviver);
      return Ok(result);
    }
  } catch (error) {
    if (opts.errorTolerant) {
      const recoveryResult = tryRecover(data, opts);
      if (recoveryResult.success) {
        return recoveryResult;
      }
    }

    return Err(
      createError(
        'JSON_PARSE_ERROR',
        `JSON parsing error: ${error instanceof Error ? error.message : String(error)}`,
        { recoverable: true }
      )
    );
  }
};

const parseFile = async (
  filePath: string,
  options?: JSONProcessingOptions
): Promise<Result<any, CLIError>> => {
  try {
    const data = await readFile(filePath, 'utf-8');
    return parseString(data, options);
  } catch (error) {
    return Err(
      fileSystemError(
        'read',
        filePath,
        `Failed to read JSON file: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      )
    );
  }
};

const stringify = (data: any, options?: JSONProcessingOptions): Result<string, CLIError> => {
  const opts = { ...defaultOptions, ...options };

  try {
    if (shouldUseJSON5(opts)) {
      const json = JSON5.stringify(data);
      return Ok(json);
    } else {
      const json = JSON.stringify(data);
      return Ok(json);
    }
  } catch (error) {
    return Err(
      createError(
        'JSON_SERIALIZE_ERROR',
        `JSON serialization error: ${error instanceof Error ? error.message : String(error)}`,
        { recoverable: true }
      )
    );
  }
};

const writeJSONFile = async (
  data: any,
  filePath: string,
  options?: JSONProcessingOptions
): Promise<Result<void, CLIError>> => {
  const stringifyResult = stringify(data, options);

  if (!stringifyResult.success) {
    return stringifyResult;
  }

  try {
    await writeFile(filePath, stringifyResult.value);
    return Ok(undefined);
  } catch (error) {
    return Err(
      fileSystemError(
        'write',
        filePath,
        `Failed to write JSON file: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      )
    );
  }
};

const validate = (data: string): Result<boolean, CLIError> => {
  return validateJSON(data);
};

const parseEnhanced = (data: string, options?: JSONProcessingOptions): Result<any, CLIError> => {
  return parseString(data, { ...options, allowTrailingCommas: true, allowComments: true });
};

const stringifyFormatted = (
  data: any,
  options?: { indent?: number; sortKeys?: boolean }
): Result<string, CLIError> => {
  const opts = { indent: 2, sortKeys: false, ...options };

  try {
    let replacer: ((key: string, value: any) => any) | undefined;

    if (opts.sortKeys) {
      replacer = (key: string, value: any) => {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          const sortedKeys = Object.keys(value).sort();
          const sortedObj: any = {};
          for (const k of sortedKeys) {
            sortedObj[k] = value[k];
          }
          return sortedObj;
        }
        return value;
      };
    }

    const json = JSON.stringify(data, replacer, opts.indent);
    return Ok(json);
  } catch (error) {
    return Err(
      createError(
        'JSON_FORMATTING_ERROR',
        `JSON formatting error: ${error instanceof Error ? error.message : String(error)}`,
        { recoverable: true }
      )
    );
  }
};

const validateJSON = (data: string): Result<boolean, CLIError> => {
  try {
    JSON.parse(data);
    return Ok(true);
  } catch (error) {
    try {
      JSON5.parse(data);
      return Ok(true);
    } catch {
      return Err(
        createError(
          'JSON_VALIDATION_ERROR',
          `JSON validation failed: ${error instanceof Error ? error.message : String(error)}`,
          { recoverable: true }
        )
      );
    }
  }
};

const minify = (data: string): Result<string, CLIError> => {
  const parseResult = parseString(data);

  if (!parseResult.success) {
    return parseResult;
  }

  try {
    const minified = JSON.stringify(parseResult.value);
    return Ok(minified);
  } catch (error) {
    return Err(
      createError(
        'JSON_MINIFICATION_ERROR',
        `JSON minification error: ${error instanceof Error ? error.message : String(error)}`,
        { recoverable: true }
      )
    );
  }
};

const tryRecover = (data: string, options: JSONProcessingOptions): Result<any, CLIError> => {
  let processedData = data;

  try {
    processedData = processedData.replace(/,(\s*[}\]])/g, '$1');
    processedData = processedData.replace(/\/\*[\s\S]*?\*\//g, '');
    processedData = processedData.replace(/\/\/.*$/gm, '');
    processedData = processedData.replace(/'/g, '"');

    const result = JSON.parse(processedData, options.reviver);
    return Ok(result);
  } catch (error) {
    return Err(
      createError(
        'JSON_RECOVERY_ERROR',
        `JSON recovery failed: ${error instanceof Error ? error.message : String(error)}`,
        { recoverable: true }
      )
    );
  }
};

export function createJSONProcessor(options?: JSONProcessingOptions): JSONProcessor {
  const mergedOptions = { ...defaultOptions, ...options };

  return {
    parseString: (data: string, opts?: JSONProcessingOptions) =>
      parseString(data, { ...mergedOptions, ...opts }),
    parseFile: (filePath: string, opts?: JSONProcessingOptions) =>
      parseFile(filePath, { ...mergedOptions, ...opts }),
    stringify: (data: any, opts?: JSONProcessingOptions) =>
      stringify(data, { ...mergedOptions, ...opts }),
    writeFile: (data: any, filePath: string, opts?: JSONProcessingOptions) =>
      writeJSONFile(data, filePath, { ...mergedOptions, ...opts }),
    validate: (data: string) => validate(data),
    parseEnhanced: (data: string, opts?: JSONProcessingOptions) =>
      parseEnhanced(data, { ...mergedOptions, ...opts }),
    stringifyFormatted: (data: any, opts?: { indent?: number; sortKeys?: boolean }) =>
      stringifyFormatted(data, opts),
    validateJSON: (data: string) => validateJSON(data),
    minify: (data: string) => minify(data),
  };
}

// Using lodash merge for deep merging
const deepMerge = (target: any, source: any): any => {
  return merge({}, target, source);
};

// Using flat library for flattening/unflattening with custom behavior for arrays
const flattenObj = (
  obj: any,
  prefix: string = '',
  separator: string = '.'
): Record<string, any> => {
  return flatten(obj, { delimiter: separator, safe: true });
};

const unflattenObj = (obj: Record<string, any>, separator: string = '.'): any => {
  return unflatten(obj, { delimiter: separator });
};

// Using fast-deep-equal for performance
const deepEqual = (obj1: any, obj2: any): boolean => {
  return equal(obj1, obj2);
};

// Using lodash for path operations
const getPath = (obj: any, path: string, separator: string = '.'): any => {
  return get(obj, path.split(separator));
};

const setPath = (obj: any, path: string, value: any, separator: string = '.'): any => {
  return set(obj, path.split(separator), value);
};

const removePath = (obj: any, path: string, separator: string = '.'): any => {
  return unset(obj, path.split(separator));
};

const prettify = (obj: any, indent: number = 2): Result<string, CLIError> => {
  try {
    const pretty = JSON.stringify(obj, null, indent);
    return Ok(pretty);
  } catch (error) {
    return Err(
      createError(
        'JSON_PRETTIFICATION_ERROR',
        `JSON prettification error: ${error instanceof Error ? error.message : String(error)}`,
        { recoverable: true }
      )
    );
  }
};

const compact = (obj: any): Result<string, CLIError> => {
  try {
    const compact = JSON.stringify(obj);
    return Ok(compact);
  } catch (error) {
    return Err(
      createError(
        'JSON_COMPACTION_ERROR',
        `JSON compaction error: ${error instanceof Error ? error.message : String(error)}`,
        { recoverable: true }
      )
    );
  }
};

const validateSchema = (data: any, schema: any): Result<boolean, CLIError> => {
  try {
    return Ok(matchesSchema(data, schema));
  } catch (error) {
    return Err(
      createError(
        'JSON_SCHEMA_VALIDATION_ERROR',
        `Schema validation error: ${error instanceof Error ? error.message : String(error)}`,
        { recoverable: true }
      )
    );
  }
};

const matchesSchema = (data: any, schema: any): boolean => {
  if (schema && typeof schema === 'object' && !Array.isArray(schema)) {
    for (const key in schema) {
      if (schema.hasOwnProperty(key)) {
        const propSchema = schema[key];
        const propData = data[key];

        if (propSchema.type) {
          switch (propSchema.type) {
            case 'string':
              if (typeof propData !== 'string') return false;
              break;
            case 'number':
              if (typeof propData !== 'number') return false;
              break;
            case 'boolean':
              if (typeof propData !== 'boolean') return false;
              break;
            case 'array':
              if (!Array.isArray(propData)) return false;
              break;
            case 'object':
              if (typeof propData !== 'object' || propData === null || Array.isArray(propData))
                return false;
              break;
            default:
              return true;
          }
        }
      }
    }
  }

  return true;
};

export const jsonUtils = {
  deepMerge,
  flatten: flattenObj,
  unflatten: unflattenObj,
  deepEqual,
  getPath,
  setPath,
  removePath,
  prettify,
  compact,
  validateSchema,
  matchesSchema,
};
