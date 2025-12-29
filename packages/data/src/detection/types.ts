/**
 * @module detection/types
 * @description Type definitions and defaults for format detection operations
 *
 * Provides magic number patterns, extension mappings, and detection function types
 * for identifying file formats from various sources.
 */

import type {
  DetectionConfig,
  DetectionOperations,
  FormatResult,
  DetectionResult,
  FileFormatInfo,
  DetectionReliability,
} from '../formats-types.js'

// ========================================
// Detection Configuration Defaults
// ========================================

/**
 * Default configuration for format detection operations
 *
 * @property {number} timeout - Operation timeout (10s)
 * @property {number} maxSize - Max file size for detection (10MB)
 * @property {boolean} strictMode - Strict validation mode (false)
 * @property {boolean} enableExtensionFallback - Fall back to extension detection (true)
 * @property {number} bufferSize - Buffer size for magic number detection (4KB)
 * @property {boolean} useFileExtension - Enable extension-based detection (true)
 * @property {boolean} useMagicNumbers - Enable magic number detection (true)
 */
export const defaultDetectionConfig: Required<DetectionConfig> = {
  timeout: 10000,
  maxSize: 10 * 1024 * 1024, // 10MB
  strictMode: false,
  enableExtensionFallback: true,
  bufferSize: 4096, // 4KB should be enough for most magic numbers
  useFileExtension: true,
  useMagicNumbers: true,
} as const

// ========================================
// Magic Number Patterns
// ========================================

/**
 * Pattern for detecting file format via magic number signature
 *
 * @property {Uint8Array} signature - Byte sequence to match
 * @property {number} offset - Byte offset from start of file
 * @property {Uint8Array} [mask] - Optional bit mask for partial matching
 * @property {FileFormatInfo} format - Format info when pattern matches
 */
export interface MagicNumberPattern {
  readonly signature: Uint8Array
  readonly offset: number
  readonly mask?: Uint8Array
  readonly format: FileFormatInfo
}

/**
 * Mapping from file extension to format information
 *
 * @property {string} extension - File extension with dot (e.g., '.json')
 * @property {FileFormatInfo} format - Associated format info
 * @property {DetectionReliability} reliability - Reliability of extension-based detection
 */
export interface ExtensionMapping {
  readonly extension: string
  readonly format: FileFormatInfo
  readonly reliability: DetectionReliability
}

// ========================================
// Detection Function Types
// ========================================

/** Factory function type for creating detection operations */
export type CreateDetectionOperations = (config?: DetectionConfig) => DetectionOperations

/** Function type for format detection strategies */
export type DetectionStrategy = (
  input: Buffer | string,
  config: DetectionConfig
) => FormatResult<DetectionResult>

/** Function type for magic number-based detection */
export type MagicNumberDetector = (
  buffer: Buffer,
  config: DetectionConfig
) => FormatResult<DetectionResult>

/** Function type for extension-based detection */
export type ExtensionDetector = (
  filename: string,
  config: DetectionConfig
) => FormatResult<DetectionResult>

// ========================================
// Format Database Types
// ========================================

/**
 * Database of format detection patterns and mappings
 *
 * @property {readonly MagicNumberPattern[]} magicNumbers - Magic number patterns
 * @property {readonly ExtensionMapping[]} extensions - Extension mappings
 * @property {ReadonlyMap<string, FileFormatInfo>} mimeTypes - MIME type to format map
 */
export interface FormatDatabase {
  readonly magicNumbers: readonly MagicNumberPattern[]
  readonly extensions: readonly ExtensionMapping[]
  readonly mimeTypes: ReadonlyMap<string, FileFormatInfo>
}

// ========================================
// Common Format Categories
// ========================================

export const IMAGE_FORMATS = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'bmp',
  'webp',
  'svg',
  'ico',
  'tiff',
  'tif',
] as const

export const VIDEO_FORMATS = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', '3gp'] as const

export const AUDIO_FORMATS = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'] as const

export const DOCUMENT_FORMATS = [
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'txt',
  'rtf',
] as const

export const ARCHIVE_FORMATS = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'] as const

export const CODE_FORMATS = [
  'js',
  'ts',
  'jsx',
  'tsx',
  'py',
  'java',
  'cpp',
  'c',
  'cs',
  'php',
  'rb',
  'go',
] as const

export const DATA_FORMATS = ['json', 'xml', 'csv', 'yaml', 'yml', 'toml', 'ini'] as const
