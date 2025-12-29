/**
 * @module conversion/types
 * @description Type definitions and constants for format conversion operations
 *
 * Provides conversion rules, chains, and quality definitions for format-to-format
 * conversion support across different file categories.
 */

import type {
  ConversionConfig,
  ConversionOperations,
  FormatResult,
  ConversionInfo,
  ConversionQuality,
  FileCategory,
} from '../formats-types.js'

// ========================================
// Conversion Configuration Defaults
// ========================================

/**
 * Default configuration for format conversion operations
 *
 * @property {number} timeout - Operation timeout (30s)
 * @property {number} maxSize - Max file size for conversion (100MB)
 * @property {boolean} strictMode - Strict validation mode (false)
 * @property {boolean} enableExtensionFallback - Fall back to extension (true)
 * @property {number} quality - Default conversion quality (85)
 * @property {boolean} preserveMetadata - Preserve metadata (true)
 */
export const defaultConversionConfig: Required<ConversionConfig> = {
  timeout: 30000,
  maxSize: 100 * 1024 * 1024, // 100MB
  strictMode: false,
  enableExtensionFallback: true,
  quality: 85,
  preserveMetadata: true,
} as const

// ========================================
// Conversion Support Database
// ========================================

/**
 * Rule defining conversion capability between two formats
 *
 * @property {string} fromFormat - Source format identifier
 * @property {string} toFormat - Target format identifier
 * @property {ConversionQuality} quality - Expected quality level
 * @property {boolean} supported - Whether conversion is supported
 * @property {boolean} directConversion - Whether direct conversion is available
 * @property {string} [intermediateFormat] - Intermediate format for chain conversions
 * @property {readonly string[]} [tools] - Required tools for conversion
 * @property {readonly string[]} [limitations] - Known limitations
 */
export interface ConversionRule {
  readonly fromFormat: string
  readonly toFormat: string
  readonly quality: ConversionQuality
  readonly supported: boolean
  readonly directConversion: boolean
  readonly intermediateFormat?: string
  readonly tools?: readonly string[]
  readonly limitations?: readonly string[]
}

/**
 * Multi-step conversion chain for formats without direct conversion
 *
 * @property {readonly ConversionRule[]} steps - Ordered conversion steps
 * @property {ConversionQuality} quality - Overall chain quality
 * @property {number} estimatedTime - Estimated time in milliseconds
 * @property {readonly string[]} requirements - Required tools/dependencies
 */
export interface ConversionChain {
  readonly steps: readonly ConversionRule[]
  readonly quality: ConversionQuality
  readonly estimatedTime: number
  readonly requirements: readonly string[]
}

// ========================================
// Conversion Function Types
// ========================================

/** Factory function type for creating conversion operations */
export type CreateConversionOperations = (config?: ConversionConfig) => ConversionOperations

/** Function type for checking conversion support between formats */
export type ConversionChecker = (
  fromFormat: string,
  toFormat: string
) => FormatResult<ConversionInfo>

/** Function type for listing supported formats by category */
export type FormatLister = (category?: FileCategory) => FormatResult<readonly string[]>

/** Function type for building conversion chains */
export type ChainBuilder = (fromFormat: string, toFormat: string) => FormatResult<readonly string[]>

/** Function type for estimating conversion quality */
export type QualityEstimator = (
  fromFormat: string,
  toFormat: string
) => FormatResult<ConversionQuality>

// ========================================
// Format Categories for Conversion
// ========================================

/**
 * Format categories with supported formats for each category
 *
 * Used to determine conversion compatibility and available formats
 * within each category (image, video, audio, document, etc.).
 */
export const CONVERSION_CATEGORIES = {
  IMAGE_RASTER: ['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'webp', 'gif'],
  IMAGE_VECTOR: ['svg', 'eps', 'ai', 'pdf'],
  VIDEO: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'],
  AUDIO: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'],
  DOCUMENT_TEXT: ['txt', 'rtf', 'md', 'html', 'tex'],
  DOCUMENT_OFFICE: ['doc', 'docx', 'odt', 'pdf'],
  SPREADSHEET: ['xls', 'xlsx', 'ods', 'csv'],
  PRESENTATION: ['ppt', 'pptx', 'odp', 'pdf'],
  ARCHIVE: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'],
  DATA: ['json', 'xml', 'yaml', 'toml', 'csv', 'tsv'],
} as const

// ========================================
// Quality Definitions
// ========================================

/**
 * Quality level definitions with fidelity and data loss information
 *
 * Provides metadata about each conversion quality level to help
 * users understand the implications of format conversions.
 */
export const QUALITY_DEFINITIONS: Record<
  ConversionQuality,
  {
    description: string
    dataLoss: boolean
    fidelity: number // 0-1 scale
  }
> = {
  lossless: {
    description: 'No data loss during conversion',
    dataLoss: false,
    fidelity: 1.0,
  },
  lossy: {
    description: 'Some data loss but maintains usability',
    dataLoss: true,
    fidelity: 0.7,
  },
  transcode: {
    description: 'Format change with potential quality adjustment',
    dataLoss: true,
    fidelity: 0.85,
  },
}
