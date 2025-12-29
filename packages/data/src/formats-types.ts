/**
 * @module formats-types
 * @description Type definitions for format detection, MIME handling, and conversion operations
 *
 * Provides comprehensive type definitions for file format detection, MIME type handling,
 * and format conversion operations across the data package.
 */

import type { Result, CoreError } from '@trailhead/core'

// ========================================
// Configuration Types
// ========================================

/**
 * Base configuration for format operations
 *
 * @property {number} [timeout] - Operation timeout in milliseconds
 * @property {number} [maxSize] - Maximum file size in bytes
 * @property {boolean} [strictMode] - Enable strict validation mode
 * @property {boolean} [enableExtensionFallback] - Fall back to extension-based detection
 */
export interface FormatConfig {
  readonly timeout?: number
  readonly maxSize?: number
  readonly strictMode?: boolean
  readonly enableExtensionFallback?: boolean
}

/**
 * Configuration for format detection operations
 *
 * @extends FormatConfig
 * @property {number} [bufferSize] - Buffer size for reading file headers (default: 4096)
 * @property {boolean} [useFileExtension] - Enable extension-based detection
 * @property {boolean} [useMagicNumbers] - Enable magic number signature detection
 */
export interface DetectionConfig extends FormatConfig {
  readonly bufferSize?: number
  readonly useFileExtension?: boolean
  readonly useMagicNumbers?: boolean
}

/**
 * Configuration for MIME type operations
 *
 * @extends FormatConfig
 * @property {string} [charset] - Default character set (e.g., 'utf-8')
 * @property {string} [defaultMimeType] - Fallback MIME type for unknown formats
 */
export interface MimeConfig extends FormatConfig {
  readonly charset?: string
  readonly defaultMimeType?: string
}

/**
 * Configuration for format conversion operations
 *
 * @extends FormatConfig
 * @property {number} [quality] - Conversion quality (0-100 for lossy formats)
 * @property {boolean} [preserveMetadata] - Preserve metadata during conversion
 */
export interface ConversionConfig extends FormatConfig {
  readonly quality?: number
  readonly preserveMetadata?: boolean
}

// ========================================
// Result Types
// ========================================

/**
 * Standard Result type for format operations
 * @template T - Success value type
 */
export type FormatResult<T> = Result<T, CoreError>

// ========================================
// File Format Types
// ========================================

/**
 * Detailed information about a detected file format
 *
 * @property {string} ext - File extension without dot (e.g., 'json', 'csv')
 * @property {string} mime - MIME type string (e.g., 'application/json')
 * @property {string} description - Human-readable format description
 * @property {FileCategory} category - High-level format category
 * @property {number} confidence - Detection confidence score (0-1)
 * @property {FormatDetails} [details] - Additional format-specific metadata
 */
export interface FileFormatInfo {
  readonly ext: string
  readonly mime: string
  readonly description: string
  readonly category: FileCategory
  readonly confidence: number
  readonly details?: FormatDetails
}

/**
 * Format-specific metadata (version, encoding, dimensions, etc.)
 *
 * @property {string} [version] - Format version identifier
 * @property {string} [encoding] - Character encoding
 * @property {Object} [dimensions] - Media dimensions (width/height)
 * @property {number} [duration] - Media duration in seconds
 * @property {number} [bitrate] - Audio/video bitrate
 * @property {number} [sampleRate] - Audio sample rate
 * @property {number} [colorDepth] - Image color depth
 * @property {string} [compression] - Compression method
 * @property {Record<string, unknown>} [metadata] - Additional metadata
 */
export interface FormatDetails {
  readonly version?: string
  readonly encoding?: string
  readonly dimensions?: {
    readonly width: number
    readonly height: number
  }
  readonly duration?: number
  readonly bitrate?: number
  readonly sampleRate?: number
  readonly colorDepth?: number
  readonly compression?: string
  readonly metadata?: Record<string, unknown>
}

/**
 * High-level file format category for grouping similar formats
 */
export type FileCategory =
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'archive'
  | 'code'
  | 'data'
  | 'font'
  | 'executable'
  | 'unknown'

// ========================================
// Detection Types
// ========================================

/**
 * Result of a format detection operation
 *
 * @property {FileFormatInfo} format - Detected format information
 * @property {DetectionSource} source - Method used for detection
 * @property {DetectionReliability} reliability - Reliability level of detection
 */
export interface DetectionResult {
  readonly format: FileFormatInfo
  readonly source: DetectionSource
  readonly reliability: DetectionReliability
}

/** Method used to detect file format */
export type DetectionSource =
  | 'magic-numbers'
  | 'file-extension'
  | 'mime-header'
  | 'content-analysis'
  | 'metadata'

/** Reliability level of format detection (high > medium > low) */
export type DetectionReliability = 'high' | 'medium' | 'low'

// ========================================
// MIME Types
// ========================================

/**
 * Parsed MIME type information
 *
 * @property {string} type - Primary type (e.g., 'application', 'image')
 * @property {string} subtype - Subtype (e.g., 'json', 'png')
 * @property {string} full - Full MIME type string
 * @property {readonly string[]} extensions - Associated file extensions
 * @property {string} [charset] - Character set if applicable
 * @property {boolean} compressible - Whether content is compressible
 * @property {FileCategory} category - File category classification
 */
export interface MimeTypeInfo {
  readonly type: string
  readonly subtype: string
  readonly full: string
  readonly extensions: readonly string[]
  readonly charset?: string
  readonly compressible: boolean
  readonly category: FileCategory
}

// ========================================
// Conversion Types
// ========================================

/**
 * Information about format conversion capability
 *
 * @property {string} fromFormat - Source format identifier
 * @property {string} toFormat - Target format identifier
 * @property {boolean} supported - Whether conversion is supported
 * @property {ConversionQuality} quality - Expected quality level
 * @property {ConversionOptions} [options] - Available conversion options
 */
export interface ConversionInfo {
  readonly fromFormat: string
  readonly toFormat: string
  readonly supported: boolean
  readonly quality: ConversionQuality
  readonly options?: ConversionOptions
}

/**
 * Quality level indicator for format conversions
 * - lossless: No data loss during conversion
 * - lossy: Some quality/data loss but acceptable
 * - transcode: Format transcoding with potential adjustments
 */
export type ConversionQuality = 'lossless' | 'lossy' | 'transcode'

/**
 * Options for format conversion operations
 *
 * @property {number} [quality] - Quality level (0-100)
 * @property {string} [compression] - Compression method
 * @property {Object} [resize] - Image resize options
 * @property {Object} [metadata] - Metadata handling options
 */
export interface ConversionOptions {
  readonly quality?: number
  readonly compression?: string
  readonly resize?: {
    readonly width: number
    readonly height: number
    readonly maintainAspectRatio?: boolean
  }
  readonly metadata?: {
    readonly preserve: boolean
    readonly strip?: string[]
    readonly add?: Record<string, string>
  }
}

// ========================================
// Operational Types
// ========================================

/** Detects format from buffer content */
export type DetectFromBufferOp = (
  buffer: Buffer,
  config?: DetectionConfig
) => Promise<FormatResult<DetectionResult>>

/** Detects format from file path (reads file content) */
export type DetectFromFileOp = (
  filePath: string,
  config?: DetectionConfig
) => Promise<FormatResult<DetectionResult>>

/** Detects format from file extension */
export type DetectFromExtensionOp = (
  extension: string,
  config?: DetectionConfig
) => FormatResult<FileFormatInfo>

/** Gets MIME type info from file path or buffer */
export type GetMimeTypeOp = (
  input: string | Buffer,
  config?: MimeConfig
) => FormatResult<MimeTypeInfo>

/** Gets file extensions associated with a MIME type */
export type GetExtensionsOp = (
  mimeType: string,
  config?: MimeConfig
) => FormatResult<readonly string[]>

/** Checks if MIME type belongs to a category */
export type IsMimeTypeOp = (mimeType: string, category: FileCategory) => FormatResult<boolean>

/** Checks if conversion between formats is supported */
export type CheckConversionOp = (
  fromFormat: string,
  toFormat: string
) => FormatResult<ConversionInfo>

/** Gets list of supported formats for a category */
export type GetSupportedFormatsOp = (category?: FileCategory) => FormatResult<readonly string[]>

// ========================================
// Operations Interfaces
// ========================================

/**
 * Interface for format detection operations
 * Provides methods to detect file formats from various sources
 */
export interface DetectionOperations {
  readonly detectFromBuffer: DetectFromBufferOp
  readonly detectFromFile: DetectFromFileOp
  readonly detectFromExtension: DetectFromExtensionOp
  readonly detectFromMime: (
    mimeType: string,
    config?: DetectionConfig
  ) => FormatResult<FileFormatInfo>
  readonly detectBatch: (
    files: string[],
    config?: DetectionConfig
  ) => Promise<FormatResult<DetectionResult[]>>
}

/**
 * Interface for MIME type operations
 * Provides methods to work with MIME types and file extensions
 */
export interface MimeOperations {
  readonly getMimeType: GetMimeTypeOp
  readonly getExtensions: GetExtensionsOp
  readonly isMimeType: IsMimeTypeOp
  readonly normalizeMimeType: (mimeType: string) => FormatResult<string>
  readonly parseMimeType: (mimeType: string) => FormatResult<MimeTypeInfo>
}

/**
 * Interface for format conversion operations
 * Provides methods to check conversion support and build conversion chains
 */
export interface ConversionOperations {
  readonly checkConversion: CheckConversionOp
  readonly getSupportedFormats: GetSupportedFormatsOp
  readonly getConversionChain: (
    fromFormat: string,
    toFormat: string
  ) => FormatResult<readonly string[]>
  readonly estimateConversionQuality: (
    fromFormat: string,
    toFormat: string
  ) => FormatResult<ConversionQuality>
}
