export type {
  DataProcessingOptions,
  CSVProcessingOptions,
  JSONProcessingOptions,
  ExcelProcessingOptions,
  CSVProcessor,
  JSONProcessor,
  ExcelProcessor,
  FormatDetectionResult,
  DataConverter,
} from './types.js';

export { createCSVProcessor, csvUtils } from './csv.js';

export { createJSONProcessor, jsonUtils } from './json.js';

export { createExcelProcessor, excelUtils } from './excel.js';

export { createDataConverter, detectFormat, conversionUtils } from './converter.js';

export { isOk, isErr, unwrap, unwrapOr, map, chain, Ok, Err } from '../core/errors/index.js';

import * as csvModule from './csv.js';
import * as jsonModule from './json.js';
import * as excelModule from './excel.js';
import * as converterModule from './converter.js';
import type {
  CSVProcessingOptions,
  JSONProcessingOptions,
  ExcelProcessingOptions,
  DataProcessingOptions,
} from './types.js';

export const processors = {
  csv: (options?: CSVProcessingOptions) =>
    csvModule.createCSVProcessor({
      hasHeader: true,
      dynamicTyping: true,
      autoTrim: true,
      skipEmptyLines: true,
      ...options,
    }),

  json: (options?: JSONProcessingOptions) =>
    jsonModule.createJSONProcessor({
      allowTrailingCommas: true,
      allowComments: true,
      allowSingleQuotes: true,
      autoTrim: true,
      ...options,
    }),

  excel: (options?: ExcelProcessingOptions) =>
    excelModule.createExcelProcessor({
      hasHeader: true,
      dynamicTyping: true,
      autoTrim: true,
      skipEmptyLines: true,
      worksheetIndex: 0,
      cellDates: true,
      ...options,
    }),
};

export const utils = {
  autoParse: (data: string, options?: DataProcessingOptions) => {
    const detectionResult = converterModule.detectFormat(data);
    if (!detectionResult.success) {
      return detectionResult;
    }

    const format = detectionResult.value.format;
    switch (format) {
      case 'csv':
        return processors.csv(options).parseString(data);
      case 'json':
        return processors.json(options).parseString(data);
      default:
        return {
          success: false,
          error: { code: 'UNSUPPORTED_FORMAT', message: `Unsupported format: ${format}` },
        };
    }
  },

  parse: (data: string, format: 'csv' | 'json', options?: DataProcessingOptions) => {
    switch (format) {
      case 'csv':
        return processors.csv(options).parseString(data);
      case 'json':
        return processors.json(options).parseString(data);
      default:
        return {
          success: false,
          error: { code: 'UNSUPPORTED_FORMAT', message: `Unsupported format: ${format}` },
        };
    }
  },

  parseFile: async (
    filePath: string,
    format: 'csv' | 'json' | 'excel',
    options?: DataProcessingOptions
  ) => {
    switch (format) {
      case 'csv':
        return processors.csv(options).parseFile(filePath);
      case 'json':
        return processors.json(options).parseFile(filePath);
      case 'excel':
        return processors.excel(options).parseFile(filePath);
      default:
        return {
          success: false,
          error: { code: 'UNSUPPORTED_FORMAT', message: `Unsupported format: ${format}` },
        };
    }
  },

  serialize: (data: any, format: 'csv' | 'json', options?: DataProcessingOptions) => {
    switch (format) {
      case 'csv':
        return processors.csv(options).stringify(data);
      case 'json':
        return processors.json(options).stringify(data);
      default:
        return {
          success: false,
          error: { code: 'UNSUPPORTED_FORMAT', message: `Unsupported format: ${format}` },
        };
    }
  },

  serializeAsync: async (
    data: any,
    format: 'csv' | 'json' | 'excel',
    options?: DataProcessingOptions
  ) => {
    switch (format) {
      case 'csv':
        return processors.csv(options).stringify(data);
      case 'json':
        return processors.json(options).stringify(data);
      case 'excel':
        return processors.excel(options).stringify(data);
      default:
        return {
          success: false,
          error: { code: 'UNSUPPORTED_FORMAT', message: `Unsupported format: ${format}` },
        };
    }
  },

  convert: (data: string, toFormat: 'csv' | 'json', options?: DataProcessingOptions) => {
    const converter = converterModule.createDataConverter();
    return converter.autoConvert(data, toFormat, options);
  },

  validate: (data: string | Buffer, format: 'csv' | 'json' | 'excel') => {
    switch (format) {
      case 'csv':
        if (typeof data !== 'string') {
          return {
            success: false,
            error: { code: 'INVALID_DATA_TYPE', message: 'CSV validation requires string data' },
          };
        }
        return processors.csv().validate(data);
      case 'json':
        if (typeof data !== 'string') {
          return {
            success: false,
            error: { code: 'INVALID_DATA_TYPE', message: 'JSON validation requires string data' },
          };
        }
        return processors.json().validate(data);
      case 'excel':
        if (!(data instanceof Buffer)) {
          return {
            success: false,
            error: { code: 'INVALID_DATA_TYPE', message: 'Excel validation requires Buffer data' },
          };
        }
        return processors.excel().validate(data);
      default:
        return {
          success: false,
          error: { code: 'UNSUPPORTED_FORMAT', message: `Unsupported format: ${format}` },
        };
    }
  },
};

export const presets = {
  csvAnalysis: () =>
    csvModule.createCSVProcessor({
      hasHeader: true,
      dynamicTyping: true,
      autoTrim: true,
      skipEmptyLines: true,
      errorTolerant: true,
    }),

  csvStrict: () =>
    csvModule.createCSVProcessor({
      hasHeader: true,
      dynamicTyping: false,
      autoTrim: true,
      skipEmptyLines: false,
      errorTolerant: false,
    }),

  jsonConfig: () =>
    jsonModule.createJSONProcessor({
      allowTrailingCommas: true,
      allowComments: true,
      allowSingleQuotes: false,
      allowUnquotedKeys: false,
      autoTrim: true,
    }),

  excelDataEntry: () =>
    excelModule.createExcelProcessor({
      hasHeader: true,
      dynamicTyping: true,
      autoTrim: true,
      skipEmptyLines: true,
      cellDates: true,
      cellStyles: false,
      worksheetIndex: 0,
    }),

  excelAnalysis: () =>
    excelModule.createExcelProcessor({
      hasHeader: true,
      dynamicTyping: true,
      autoTrim: true,
      skipEmptyLines: false,
      cellDates: true,
      cellStyles: true,
      cellHTML: false,
      blankrows: true,
      errorTolerant: true,
    }),

  excelReporting: () =>
    excelModule.createExcelProcessor({
      hasHeader: true,
      dynamicTyping: false,
      autoTrim: true,
      skipEmptyLines: true,
      cellDates: true,
      cellStyles: true,
      cellHTML: true,
      worksheetIndex: 0,
    }),
};

export const csv = csvModule;
export const json = jsonModule;
export const excel = excelModule;
export const converter = converterModule;

export default {
  createCSVProcessor: csvModule.createCSVProcessor,
  createJSONProcessor: jsonModule.createJSONProcessor,
  createExcelProcessor: excelModule.createExcelProcessor,
  createDataConverter: converterModule.createDataConverter,
  detectFormat: converterModule.detectFormat,
  processors,
  utils,
  presets,
  csv: csvModule,
  json: jsonModule,
  excel: excelModule,
  converter: converterModule,
};
