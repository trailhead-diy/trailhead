import Papa from 'papaparse';
import { readFile, writeFile } from 'fs/promises';
import type { Result } from '../core/errors/types.js';
import type { CLIError } from '../core/errors/types.js';
import { ok, err } from 'neverthrow';
import { createError, fileSystemError } from '../core/errors/factory.js';
import type { CSVProcessor, CSVProcessingOptions } from './types.js';

const defaultOptions: CSVProcessingOptions = {
  delimiter: '', // Let Papa Parse auto-detect
  quoteChar: '"',
  escapeChar: '"',
  hasHeader: true,
  dynamicTyping: true,
  autoTrim: true,
  skipEmptyLines: true,
  detectDelimiter: true,
  errorTolerant: false,
};

const buildParseConfig = (options: CSVProcessingOptions = {}): Papa.ParseConfig => {
  const opts = { ...defaultOptions, ...options };
  return {
    header: opts.hasHeader,
    delimiter: opts.delimiter || '', // Auto-detect if empty
    quoteChar: opts.quoteChar,
    escapeChar: opts.escapeChar,
    dynamicTyping: opts.dynamicTyping,
    skipEmptyLines: opts.skipEmptyLines,
    transformHeader: opts.transformHeader,
    transform: opts.transform,
    comments: opts.comments,
    preview: opts.maxRows,
    delimitersToGuess: [',', ';', '\t', '|'], // Papa Parse auto-detection
  };
};

const buildUnparseConfig = (options: CSVProcessingOptions = {}): Papa.UnparseConfig => {
  const opts = { ...defaultOptions, ...options };
  return {
    header: opts.hasHeader,
    delimiter: opts.delimiter || ',', // Default to comma if not specified
    quoteChar: opts.quoteChar,
    escapeChar: opts.escapeChar,
    quotes: false,
    skipEmptyLines: opts.skipEmptyLines,
  };
};

const detectHeader = (data: any[][]): boolean => {
  if (data.length < 2) return false;

  const firstRow = data[0];
  const secondRow = data[1];

  // Enhanced header detection patterns
  const headerPatterns = [
    /^(name|title|label|description)$/i,
    /^(id|identifier|key|index)$/i,
    /^(email|mail|address)$/i,
    /^(age|year|date|time|created|updated)$/i,
    /^(status|state|type|category)$/i,
    /^(price|cost|amount|value|total)$/i,
    /^(count|quantity|number|num)$/i,
  ];

  let firstRowStrings = 0;
  let secondRowNumbers = 0;
  let headerPatternMatches = 0;

  for (let i = 0; i < Math.min(firstRow.length, secondRow.length); i++) {
    const firstValue = String(firstRow[i]);
    const secondValue = String(secondRow[i]);

    if (isNaN(Number(firstValue)) && firstValue.trim() !== '') {
      firstRowStrings++;
    }
    if (!isNaN(Number(secondValue)) && secondValue.trim() !== '') {
      secondRowNumbers++;
    }

    // Check if first row values match typical header patterns
    if (headerPatterns.some(pattern => pattern.test(firstValue))) {
      headerPatternMatches++;
    }
  }

  // More confident header detection
  return (
    (firstRowStrings > 0 && secondRowNumbers > 0) || headerPatternMatches > firstRow.length * 0.3
  );
};

const parseString = (data: string, options?: CSVProcessingOptions): Result<any, CLIError> => {
  const config = buildParseConfig(options);
  const opts = { ...defaultOptions, ...options };

  try {
    const result = Papa.parse(data, config);

    if (result.errors.length > 0 && !opts.errorTolerant) {
      const errorMessages = result.errors.map(
        (err: any) => `${err.type}: ${err.message} at row ${err.row}`
      );
      return err(
        createError('CSV_PARSE_ERROR', `CSV parsing failed: ${errorMessages.join(', ')}`, {
          recoverable: true,
        })
      );
    }

    return ok(result.data);
  } catch (error) {
    return err(
      createError(
        'CSV_PARSE_ERROR',
        `CSV parsing error: ${error instanceof Error ? error.message : String(error)}`,
        { recoverable: true }
      )
    );
  }
};

const parseFile = async (
  filePath: string,
  options?: CSVProcessingOptions
): Promise<Result<any, CLIError>> => {
  try {
    const data = await readFile(filePath, 'utf-8');
    return parseString(data, options);
  } catch (error) {
    return err(
      fileSystemError(
        'read',
        filePath,
        `Failed to read CSV file: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      )
    );
  }
};

const stringify = (data: any, options?: CSVProcessingOptions): Result<string, CLIError> => {
  const config = buildUnparseConfig(options);

  try {
    const csv = Papa.unparse(data, config);
    return ok(csv);
  } catch (error) {
    return err(
      createError(
        'CSV_SERIALIZE_ERROR',
        `CSV serialization error: ${error instanceof Error ? error.message : String(error)}`,
        { recoverable: true }
      )
    );
  }
};

const writeCSVFile = async (
  data: any,
  filePath: string,
  options?: CSVProcessingOptions
): Promise<Result<void, CLIError>> => {
  const stringifyResult = stringify(data, options);

  if (stringifyResult.isErr()) {
    return err(stringifyResult.error);
  }

  try {
    await writeFile(filePath, stringifyResult.value);
    return ok(undefined);
  } catch (error) {
    return err(
      fileSystemError(
        'write',
        filePath,
        `Failed to write CSV file: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      )
    );
  }
};

const validate = (data: string): Result<boolean, CLIError> => {
  try {
    // Use Papa Parse's built-in validation with auto-detection
    const result = Papa.parse(data, {
      header: false,
      skipEmptyLines: true,
      preview: 10,
      delimiter: '', // Auto-detect
      delimitersToGuess: [',', ';', '\t', '|'],
    });

    if (result.errors.length > 0) {
      const criticalErrors = result.errors.filter(
        (err: any) =>
          err.type === 'Delimiter' || err.type === 'Quotes' || err.type === 'FieldMismatch'
      );

      if (criticalErrors.length > 0) {
        return ok(false);
      }
    }

    const rows = result.data as any[][];
    if (rows.length > 1) {
      const firstRowLength = rows[0].length;
      const inconsistentRows = rows.filter(row => row.length !== firstRowLength);
      // Allow some tolerance for inconsistent rows
      if (inconsistentRows.length > rows.length * 0.1) {
        return ok(false);
      }
    }

    return ok(true);
  } catch (error) {
    return err(
      createError(
        'CSV_VALIDATION_ERROR',
        `CSV validation error: ${error instanceof Error ? error.message : String(error)}`,
        { recoverable: true }
      )
    );
  }
};

const parseToObjects = (
  data: string,
  options?: CSVProcessingOptions
): Result<Record<string, any>[], CLIError> => {
  const config = buildParseConfig({ ...options, hasHeader: true });
  const opts = { ...defaultOptions, ...options };

  try {
    const result = Papa.parse<Record<string, any>>(data, config);

    if (result.errors.length > 0 && !opts.errorTolerant) {
      const errorMessages = result.errors.map(
        (err: any) => `${err.type}: ${err.message} at row ${err.row}`
      );
      return err(
        createError('CSV_PARSE_ERROR', `CSV parsing failed: ${errorMessages.join(', ')}`, {
          recoverable: true,
        })
      );
    }

    return ok(result.data);
  } catch (error) {
    return err(
      createError(
        'CSV_PARSE_ERROR',
        `CSV parsing error: ${error instanceof Error ? error.message : String(error)}`,
        { recoverable: true }
      )
    );
  }
};

const parseToArrays = (
  data: string,
  options?: CSVProcessingOptions
): Result<string[][], CLIError> => {
  const config = buildParseConfig({ ...options, hasHeader: false });
  const opts = { ...defaultOptions, ...options };

  try {
    const result = Papa.parse<string[]>(data, config);

    if (result.errors.length > 0 && !opts.errorTolerant) {
      const errorMessages = result.errors.map(
        (err: any) => `${err.type}: ${err.message} at row ${err.row}`
      );
      return err(
        createError('CSV_PARSE_ERROR', `CSV parsing failed: ${errorMessages.join(', ')}`, {
          recoverable: true,
        })
      );
    }

    return ok(result.data);
  } catch (error) {
    return err(
      createError(
        'CSV_PARSE_ERROR',
        `CSV parsing error: ${error instanceof Error ? error.message : String(error)}`,
        { recoverable: true }
      )
    );
  }
};

const fromObjects = (
  objects: Record<string, any>[],
  options?: CSVProcessingOptions
): Result<string, CLIError> => {
  const config = buildUnparseConfig({ ...options, hasHeader: true });

  try {
    const csv = Papa.unparse(objects, config);
    return ok(csv);
  } catch (error) {
    return err(
      createError(
        'CSV_SERIALIZE_ERROR',
        `CSV serialization error: ${error instanceof Error ? error.message : String(error)}`,
        { recoverable: true }
      )
    );
  }
};

const fromArrays = (
  arrays: string[][],
  options?: CSVProcessingOptions
): Result<string, CLIError> => {
  const config = buildUnparseConfig({ ...options, hasHeader: false });

  try {
    const csv = Papa.unparse(arrays, config);
    return ok(csv);
  } catch (error) {
    return err(
      createError(
        'CSV_SERIALIZE_ERROR',
        `CSV serialization error: ${error instanceof Error ? error.message : String(error)}`,
        { recoverable: true }
      )
    );
  }
};

const detectFormat = (
  data: string
): Result<
  {
    delimiter: string;
    quoteChar: string;
    hasHeader: boolean;
    rowCount: number;
    columnCount: number;
    linebreak: string;
    aborted: boolean;
  },
  CLIError
> => {
  try {
    // Let Papa Parse auto-detect everything
    const result = Papa.parse(data, {
      header: false,
      skipEmptyLines: true,
      preview: 100,
      delimiter: '', // Auto-detect
      delimitersToGuess: [',', ';', '\t', '|'],
    });

    const delimiter = result.meta.delimiter;
    const linebreak = result.meta.linebreak;
    const rowCount = result.data.length;
    const columnCount = result.data.length > 0 ? (result.data[0] as any[]).length : 0;
    const hasHeader = detectHeader(result.data as any[][]);
    const aborted = result.meta.aborted;

    return ok({
      delimiter,
      quoteChar: '"',
      hasHeader,
      rowCount,
      columnCount,
      linebreak,
      aborted,
    });
  } catch (error) {
    return err(
      createError(
        'CSV_FORMAT_DETECTION_ERROR',
        `CSV format detection error: ${error instanceof Error ? error.message : String(error)}`,
        { recoverable: true }
      )
    );
  }
};

export function createCSVProcessor(options?: CSVProcessingOptions): CSVProcessor {
  const mergedOptions = { ...defaultOptions, ...options };

  return {
    parseString: (data: string, opts?: CSVProcessingOptions) =>
      parseString(data, { ...mergedOptions, ...opts }),
    parseFile: (filePath: string, opts?: CSVProcessingOptions) =>
      parseFile(filePath, { ...mergedOptions, ...opts }),
    stringify: (data: any, opts?: CSVProcessingOptions) =>
      stringify(data, { ...mergedOptions, ...opts }),
    writeFile: (data: any, filePath: string, opts?: CSVProcessingOptions) =>
      writeCSVFile(data, filePath, { ...mergedOptions, ...opts }),
    validate: (data: string) => validate(data),
    detectFormat: (data: string) => detectFormat(data),
    parseToObjects: (data: string, opts?: CSVProcessingOptions) =>
      parseToObjects(data, { ...mergedOptions, ...opts }),
    parseToArrays: (data: string, opts?: CSVProcessingOptions) =>
      parseToArrays(data, { ...mergedOptions, ...opts }),
    fromObjects: (objects: Record<string, any>[], opts?: CSVProcessingOptions) =>
      fromObjects(objects, { ...mergedOptions, ...opts }),
    fromArrays: (arrays: string[][], opts?: CSVProcessingOptions) =>
      fromArrays(arrays, { ...mergedOptions, ...opts }),
  };
}

const detectDelimiter = (data: string): Result<string, CLIError> => {
  try {
    // Use Papa Parse's superior delimiter detection
    const result = Papa.parse(data, {
      header: false,
      preview: 10,
      delimiter: '', // Auto-detect
      delimitersToGuess: [',', ';', '\t', '|'],
    });

    if (!result.meta.delimiter) {
      return err(
        createError('CSV_DELIMITER_DETECTION_ERROR', 'Could not detect CSV delimiter', {
          recoverable: true,
        })
      );
    }

    // Additional check: ensure the delimiter actually appears in the data
    const delimiterPattern = new RegExp(`\\${result.meta.delimiter}`);
    if (!delimiterPattern.test(data)) {
      return err(
        createError('CSV_DELIMITER_DETECTION_ERROR', 'Could not detect CSV delimiter', {
          recoverable: true,
        })
      );
    }

    return ok(result.meta.delimiter);
  } catch (error) {
    return err(
      createError(
        'CSV_DELIMITER_DETECTION_ERROR',
        `CSV delimiter detection error: ${error instanceof Error ? error.message : String(error)}`,
        { recoverable: true }
      )
    );
  }
};

const escapeField = (value: string, delimiter: string = ',', quote: string = '"'): string => {
  if (value.includes(delimiter) || value.includes(quote) || value.includes('\n')) {
    return quote + value.replace(new RegExp(quote, 'g'), quote + quote) + quote;
  }
  return value;
};

const unescapeField = (value: string, quote: string = '"'): string => {
  if (value.startsWith(quote) && value.endsWith(quote)) {
    return value.slice(1, -1).replace(new RegExp(quote + quote, 'g'), quote);
  }
  return value;
};

const convertDelimiter = (
  csvData: string,
  fromDelimiter: string,
  toDelimiter: string
): Result<string, CLIError> => {
  const processor = createCSVProcessor({ delimiter: fromDelimiter });
  const parseResult = processor.parseString(csvData);

  if (parseResult.isErr()) {
    return err(parseResult.error);
  }

  const convertProcessor = createCSVProcessor({ delimiter: toDelimiter });
  return convertProcessor.stringify(parseResult.value);
};

export const csvUtils = {
  detectDelimiter,
  escapeField,
  unescapeField,
  convertDelimiter,
};
