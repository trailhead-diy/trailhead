// ========================================
// Core Types and Errors
// ========================================

export type {
  FormatConfig,
  DetectionConfig,
  MimeConfig,
  ConversionConfig,
  FormatResult,
  FileFormatInfo,
  FormatDetails,
  FileCategory,
  DetectionResult,
  DetectionSource,
  DetectionReliability,
  MimeTypeInfo,
  ConversionInfo,
  ConversionQuality,
  ConversionOptions,
  DetectFromBufferOp,
  DetectFromFileOp,
  DetectFromExtensionOp,
  GetMimeTypeOp,
  GetExtensionsOp,
  IsMimeTypeOp,
  CheckConversionOp,
  GetSupportedFormatsOp,
  DetectionOperations,
  MimeOperations,
  ConversionOperations,
} from './types.js';

export {
  createFormatError,
  createDetectionError,
  createMimeError,
  createConversionError,
  createUnsupportedFormatError,
  createInvalidBufferError,
  createInvalidMimeTypeError,
  mapFileError,
  mapLibraryError,
  mapDetectionError,
} from './errors.js';

// ========================================
// Detection Operations
// ========================================

export { createDetectionOperations } from './detection/index.js';
export type {
  MagicNumberPattern,
  ExtensionMapping,
  FormatDatabase,
  CreateDetectionOperations,
  DetectionStrategy,
  MagicNumberDetector,
  ExtensionDetector,
} from './detection/index.js';

// ========================================
// MIME Operations
// ========================================

export { createMimeOperations, COMMON_MIME_TYPES, MIME_TYPE_CATEGORIES } from './mime/index.js';
export type {
  MimeTypeEntry,
  MimeDatabase,
  CreateMimeOperations,
  MimeTypeParser,
  ExtensionResolver,
  CategoryChecker,
} from './mime/index.js';

// ========================================
// Conversion Operations
// ========================================

export {
  createConversionOperations,
  CONVERSION_CATEGORIES,
  QUALITY_DEFINITIONS,
} from './conversion/index.js';
export type {
  ConversionRule,
  ConversionChain,
  CreateConversionOperations,
  ConversionChecker,
  FormatLister,
  ChainBuilder,
  QualityEstimator,
} from './conversion/index.js';
