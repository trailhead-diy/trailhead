// ========================================
// Core Types and Errors
// ========================================

export type {
  DataConfig,
  CSVConfig,
  JSONConfig,
  ExcelConfig,
  ProcessingOptions,
  CSVProcessingOptions,
  JSONProcessingOptions,
  ExcelProcessingOptions,
  DataResult,
  FormatDetectionResult,
  CSVFormatInfo,
  ExcelFormatInfo,
  ParseOperation,
  ParseFileOperation,
  StringifyOperation,
  WriteFileOperation,
  ValidateOperation,
  CSVOperations,
  JSONOperations,
  ExcelOperations,
} from './types.js';

export {
  createDataError,
  createCSVError,
  createJSONError,
  createExcelError,
  createParsingError,
  createValidationError,
  createFormatDetectionError,
  createConversionError,
  mapNodeError,
  mapLibraryError,
  mapValidationError,
} from './errors.js';

// ========================================
// CSV Operations
// ========================================

export { createCSVOperations, defaultCSVConfig } from './csv/index.js';
export type {
  CSVConfigProvider,
  CSVParseFunction,
  CSVParseFileFunction,
  CSVStringifyFunction,
  CSVWriteFileFunction,
  CSVValidateFunction,
  CSVDetectFormatFunction,
  CreateCSVOperations,
  CSVParseResult,
  CSVStringifyOptions,
} from './csv/index.js';

// ========================================
// JSON Operations
// ========================================

export { createJSONOperations, defaultJSONConfig } from './json/index.js';
export type {
  JSONConfigProvider,
  JSONParseFunction,
  JSONParseFileFunction,
  JSONStringifyFunction,
  JSONWriteFileFunction,
  JSONValidateFunction,
  JSONMinifyFunction,
  JSONFormatFunction,
  CreateJSONOperations,
  JSONStringifyOptions,
  JSONFormatOptions,
  JSONMinifyOptions,
} from './json/index.js';

// ========================================
// Excel Operations
// ========================================

export { createExcelOperations, defaultExcelConfig } from './excel/index.js';
export type {
  ExcelConfigProvider,
  ExcelParseBufferFunction,
  ExcelParseFileFunction,
  ExcelStringifyFunction,
  ExcelWriteFileFunction,
  ExcelValidateFunction,
  ExcelDetectFormatFunction,
  CreateExcelOperations,
  ExcelWorksheet,
  ExcelMergeRange,
  ExcelWorkbookInfo,
  ExcelCellInfo,
  ExcelParseOptions,
  ExcelWriteOptions,
} from './excel/index.js';
