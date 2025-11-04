/**
 * Unified data processing library with auto-detection for CSV, JSON, and Excel formats
 *
 * This package provides:
 * - Automatic format detection and parsing
 * - Type-safe data operations with Result types
 * - Support for CSV, JSON, and Excel formats
 * - Functional programming patterns
 * - Comprehensive error handling
 *
 * @example Basic usage with auto-detection
 * ```typescript
 * import { data } from '@trailhead/data'
 *
 * // Auto-detect and parse any supported format
 * const result = await data.parseAuto('data.csv')
 * if (result.isOk()) {
 *   console.log(result.value.data) // Parsed data array
 *   console.log(result.value.format) // Detected format info
 * }
 * ```
 *
 * @example Format-specific operations
 * ```typescript
 * import { createCSVOperations } from '@trailhead/data'
 *
 * const csvOps = createCSVOperations({ delimiter: ';' })
 * const result = await csvOps.parseFile('data.csv')
 * ```
 *
 * @packageDocumentation
 * @module @trailhead/data
 */

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
} from './types.js'

/**
 * Error factory functions for creating standardized error objects
 * @see {@link createDataError} - Base error factory for data operations
 * @see {@link createCSVError} - CSV-specific error factory
 * @see {@link createJSONError} - JSON-specific error factory
 * @see {@link createExcelError} - Excel-specific error factory
 * @see {@link createParsingError} - Parsing operation error factory
 * @see {@link createValidationError} - Validation error factory
 * @see {@link createFormatDetectionError} - Format detection error factory
 * @see {@link createConversionError} - Format conversion error factory
 * @see {@link mapNodeError} - Maps Node.js errors to CoreError format
 * @see {@link mapLibraryError} - Maps third-party library errors
 * @see {@link mapValidationError} - Maps validation errors
 */
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
} from './errors.js'

// ========================================
// CSV Operations
// ========================================

/**
 * CSV operations factory and default configuration
 * @see {@link createCSVOperations} - Creates CSV operations with custom config
 * @see {@link defaultCSVConfig} - Default CSV parsing configuration
 */
export { createCSVOperations, defaultCSVConfig } from './csv/index.js'
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
} from './csv/index.js'

// ========================================
// JSON Operations
// ========================================

/**
 * JSON operations factory and default configuration
 * @see {@link createJSONOperations} - Creates JSON operations with custom config
 * @see {@link defaultJSONConfig} - Default JSON parsing configuration
 */
export { createJSONOperations, defaultJSONConfig } from './json/index.js'
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
} from './json/index.js'

// ========================================
// Excel Operations
// ========================================

/**
 * Excel operations factory and default configuration
 * @see {@link createExcelOperations} - Creates Excel operations with custom config
 * @see {@link defaultExcelConfig} - Default Excel parsing configuration
 */
export { createExcelOperations, defaultExcelConfig } from './excel/index.js'
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
} from './excel/index.js'

// ========================================
// Unified Data Operations (Main API)
// ========================================

/**
 * Main API for unified data operations with automatic format detection
 * @see {@link createUnifiedDataOperations} - Creates customized data operations instance
 * @see {@link data} - Pre-configured default instance for immediate use
 *
 * @example Auto-parsing with format detection
 * ```typescript
 * import { data } from '@trailhead/data'
 *
 * const result = await data.parseAuto('data.csv')
 * if (result.isOk()) {
 *   console.log(result.value.data) // [{ name: 'John', age: 30 }, ...]
 * }
 * ```
 */
export { createUnifiedDataOperations, data } from './operations.js'
export type { UnifiedDataConfig, UnifiedDataOperations } from './operations.js'

// ========================================
// Format Detection and Processing
// ========================================

/**
 * Format detection, MIME type handling, and conversion operations
 * @see {@link createDetectionOperations} - Creates format detection operations
 * @see {@link createMimeOperations} - Creates MIME type operations
 * @see {@link createConversionOperations} - Creates format conversion operations
 * @see {@link COMMON_MIME_TYPES} - Common MIME type mappings
 * @see {@link MIME_TYPE_CATEGORIES} - MIME type categorization
 * @see {@link CONVERSION_CATEGORIES} - Supported conversion categories
 * @see {@link QUALITY_DEFINITIONS} - Conversion quality level definitions
 */
export {
  createDetectionOperations,
  createMimeOperations,
  createConversionOperations,
  COMMON_MIME_TYPES,
  MIME_TYPE_CATEGORIES,
  CONVERSION_CATEGORIES,
  QUALITY_DEFINITIONS,
} from './formats/index.js'

export type {
  FormatConfig,
  DetectionConfig,
  MimeConfig,
  ConversionConfig,
  DetectionOperations,
  MimeOperations,
  ConversionOperations,
  FormatResult,
  DetectionResult,
  MimeTypeInfo,
  ConversionInfo,
  CreateDetectionOperations,
  CreateMimeOperations,
  CreateConversionOperations,
} from './formats/index.js'
