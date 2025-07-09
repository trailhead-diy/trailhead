import type { Result } from '../core/errors/types.js';
import type { CLIError } from '../core/errors/types.js';
import { Ok, Err, createError } from '../core/errors/factory.js';
import type { DataConverter, DataProcessingOptions, FormatDetectionResult } from './types.js';
import { createCSVProcessor } from './csv.js';
import { createJSONProcessor } from './json.js';
import { createExcelProcessor } from './excel.js';
// @ts-expect-error - no types available
import { sniff } from 'csv-sniffer';
// @ts-expect-error - no types available
import isJSON from 'is-json';

const parseData = async (
  data: string | Buffer,
  format: 'csv' | 'json' | 'excel',
  options?: DataProcessingOptions
): Promise<Result<any, CLIError>> => {
  switch (format) {
    case 'csv':
      if (typeof data !== 'string') {
        return Err(createError('INVALID_DATA_TYPE', 'CSV parsing requires string data'));
      }
      return createCSVProcessor().parseString(data, options);
    case 'json':
      if (typeof data !== 'string') {
        return Err(createError('INVALID_DATA_TYPE', 'JSON parsing requires string data'));
      }
      return createJSONProcessor().parseString(data, options);
    case 'excel':
      if (!(data instanceof Buffer)) {
        return Err(createError('INVALID_DATA_TYPE', 'Excel parsing requires Buffer data'));
      }
      return createExcelProcessor().parseBuffer(data, options);
    default:
      return Err(createError('UNSUPPORTED_FORMAT', `Unsupported source format: ${format}`));
  }
};

const serializeData = async (
  data: any,
  format: 'csv' | 'json' | 'excel',
  options?: DataProcessingOptions
): Promise<Result<string | Buffer, CLIError>> => {
  switch (format) {
    case 'csv':
      return createCSVProcessor().stringify(data, options);
    case 'json':
      return createJSONProcessor().stringify(data, options);
    case 'excel':
      return createExcelProcessor().stringify(data, options);
    default:
      return Err(createError('UNSUPPORTED_FORMAT', `Unsupported target format: ${format}`));
  }
};

const convert = async (
  data: string | Buffer,
  fromFormat: 'csv' | 'json' | 'excel',
  toFormat: 'csv' | 'json' | 'excel',
  options?: DataProcessingOptions
): Promise<Result<string | Buffer, CLIError>> => {
  if (fromFormat === toFormat) {
    return Ok(data);
  }

  const parseResult = await parseData(data, fromFormat, options);
  if (!parseResult.success) {
    return parseResult;
  }

  return serializeData(parseResult.value, toFormat, options);
};

const autoConvert = async (
  data: string | Buffer,
  toFormat: 'csv' | 'json' | 'excel',
  options?: DataProcessingOptions
): Promise<Result<string | Buffer, CLIError>> => {
  const detectionResult = detectFormat(data);
  if (!detectionResult.success) {
    return detectionResult;
  }

  const fromFormat = detectionResult.value.format;
  if (fromFormat === 'unknown') {
    return Err(createError('UNKNOWN_FORMAT', 'Could not detect source data format'));
  }

  if (fromFormat === 'excel' && typeof data === 'string') {
    return Err(createError('INVALID_DATA_TYPE', 'Excel format requires Buffer data'));
  }

  if ((fromFormat === 'csv' || fromFormat === 'json') && !(typeof data === 'string')) {
    return Err(createError('INVALID_DATA_TYPE', 'CSV/JSON formats require string data'));
  }

  return convert(data, fromFormat as any, toFormat, options);
};

const isLikelyJSON = (data: string): boolean => {
  // Use is-json library for better JSON detection
  return isJSON(data.trim());
};

const isLikelyCSV = (data: string): { isCSV: boolean; confidence: number; delimiter?: string } => {
  try {
    // Use csv-sniffer for better CSV detection
    const result = sniff(data);
    return {
      isCSV: result.confidence > 0.5,
      confidence: result.confidence,
      delimiter: result.delimiter,
    };
  } catch {
    // Fallback to basic detection
    const lines = data.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return { isCSV: false, confidence: 0 };
    }

    const delimiters = [',', ';', '\t', '|'];

    for (const delimiter of delimiters) {
      const columnCounts = lines.map(line => line.split(delimiter).length);
      const firstCount = columnCounts[0];

      const consistentLines = columnCounts.filter(count => count === firstCount);

      if (consistentLines.length > lines.length * 0.8 && firstCount > 1) {
        return { isCSV: true, confidence: 0.8, delimiter };
      }
    }

    return { isCSV: false, confidence: 0 };
  }
};

const isLikelyExcel = (data: Buffer): { isExcel: boolean; confidence: number } => {
  try {
    // Check Excel file signatures
    if (data.length < 8) {
      return { isExcel: false, confidence: 0 };
    }

    const signature = data.subarray(0, 8);

    // XLSX files start with PK (ZIP archive signature)
    const isXLSX = signature[0] === 0x50 && signature[1] === 0x4b;

    // XLS files have a different signature
    const isXLS =
      signature[0] === 0xd0 &&
      signature[1] === 0xcf &&
      signature[2] === 0x11 &&
      signature[3] === 0xe0;

    if (isXLSX || isXLS) {
      return { isExcel: true, confidence: 0.95 };
    }

    return { isExcel: false, confidence: 0 };
  } catch {
    return { isExcel: false, confidence: 0 };
  }
};

export function detectFormat(data: string | Buffer): Result<FormatDetectionResult, CLIError> {
  // Handle Buffer data (potential Excel file)
  if (data instanceof Buffer) {
    const excelResult = isLikelyExcel(data);
    if (excelResult.isExcel) {
      return Ok({
        format: 'excel',
        confidence: excelResult.confidence,
        details: {
          worksheetNames: ['Sheet1'], // Would need actual parsing for real names
          worksheetCount: 1,
        },
      });
    }

    return Ok({
      format: 'unknown',
      confidence: 0,
    });
  }

  // Handle string data (CSV/JSON)
  const trimmed = (data as string).trim();

  if (!trimmed) {
    return Ok({
      format: 'unknown',
      confidence: 0,
    });
  }

  // Check JSON first (more specific)
  if (isLikelyJSON(trimmed)) {
    return Ok({
      format: 'json',
      confidence: 0.95,
      details: {
        structure: trimmed.startsWith('[') ? 'array' : 'object',
      },
    });
  }

  // Check CSV with enhanced detection
  const csvResult = isLikelyCSV(trimmed);
  if (csvResult.isCSV) {
    const csvProcessor = createCSVProcessor();
    const formatResult = csvProcessor.detectFormat(trimmed);

    if (formatResult.success) {
      return Ok({
        format: 'csv',
        confidence: csvResult.confidence,
        details: {
          delimiter: csvResult.delimiter || formatResult.value.delimiter,
          hasHeader: formatResult.value.hasHeader,
        },
      });
    }
  }

  return Ok({
    format: 'unknown',
    confidence: 0,
  });
}

export function createDataConverter(): DataConverter {
  return {
    convert,
    autoConvert,
  };
}

const csvToJson = async (
  csv: string,
  options?: DataProcessingOptions
): Promise<Result<string, CLIError>> => {
  const converter = createDataConverter();
  const result = await converter.convert(csv, 'csv', 'json', options);
  if (result.success && typeof result.value === 'string') {
    return Ok(result.value);
  }
  return result.success
    ? Err(createError('CONVERSION_ERROR', 'Expected string result for JSON output'))
    : result;
};

const jsonToCsv = async (
  json: string,
  options?: DataProcessingOptions
): Promise<Result<string, CLIError>> => {
  const converter = createDataConverter();
  const result = await converter.convert(json, 'json', 'csv', options);
  if (result.success && typeof result.value === 'string') {
    return Ok(result.value);
  }
  return result.success
    ? Err(createError('CONVERSION_ERROR', 'Expected string result for CSV output'))
    : result;
};

const excelToCsv = async (
  excel: Buffer,
  options?: DataProcessingOptions
): Promise<Result<string, CLIError>> => {
  const converter = createDataConverter();
  const result = await converter.convert(excel, 'excel', 'csv', options);
  if (result.success && typeof result.value === 'string') {
    return Ok(result.value);
  }
  return result.success
    ? Err(createError('CONVERSION_ERROR', 'Expected string result for CSV output'))
    : result;
};

const csvToExcel = async (
  csv: string,
  options?: DataProcessingOptions
): Promise<Result<Buffer, CLIError>> => {
  const converter = createDataConverter();
  const result = await converter.convert(csv, 'csv', 'excel', options);
  if (result.success && result.value instanceof Buffer) {
    return Ok(result.value);
  }
  return result.success
    ? Err(createError('CONVERSION_ERROR', 'Expected Buffer result for Excel output'))
    : result;
};

const autoConvertTo = async (
  data: string | Buffer,
  toFormat: 'csv' | 'json' | 'excel',
  options?: DataProcessingOptions
): Promise<Result<string | Buffer, CLIError>> => {
  const converter = createDataConverter();
  return converter.autoConvert(data, toFormat, options);
};

const batchConvert = async (
  dataList: (string | Buffer)[],
  fromFormat: 'csv' | 'json' | 'excel',
  toFormat: 'csv' | 'json' | 'excel',
  options?: DataProcessingOptions
): Promise<Result<(string | Buffer)[], CLIError[]>> => {
  const converter = createDataConverter();
  const results: (string | Buffer)[] = [];
  const errors: CLIError[] = [];

  for (const data of dataList) {
    const result = await converter.convert(data, fromFormat, toFormat, options);
    if (result.success) {
      results.push(result.value);
    } else {
      errors.push(result.error);
    }
  }

  if (errors.length > 0) {
    return { success: false, error: errors };
  }

  return Ok(results);
};

export const conversionUtils = {
  csvToJson,
  jsonToCsv,
  excelToCsv,
  csvToExcel,
  autoConvertTo,
  batchConvert,
};
