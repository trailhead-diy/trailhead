/**
 * @module mime/types
 * @description Type definitions and constants for MIME type operations
 *
 * Provides MIME type database types, common MIME type constants,
 * and category mappings for file type classification.
 */

import type { MimeConfig, MimeOperations, FormatResult, FileCategory } from '../formats-types.js'

// ========================================
// MIME Configuration Defaults
// ========================================

/**
 * Default configuration for MIME type operations
 *
 * @property {number} timeout - Operation timeout (5s)
 * @property {number} maxSize - Max file size for MIME detection (1MB)
 * @property {boolean} strictMode - Strict validation mode (false)
 * @property {boolean} enableExtensionFallback - Fall back to extension (true)
 * @property {string} charset - Default character set (utf-8)
 * @property {string} defaultMimeType - Fallback MIME type (application/octet-stream)
 */
export const defaultMimeConfig: Required<MimeConfig> = {
  timeout: 5000,
  maxSize: 1024 * 1024, // 1MB
  strictMode: false,
  enableExtensionFallback: true,
  charset: 'utf-8',
  defaultMimeType: 'application/octet-stream',
} as const

// ========================================
// MIME Type Database Types
// ========================================

/**
 * Entry in the MIME type database with metadata
 *
 * @property {string} type - Primary type (e.g., 'application')
 * @property {string} subtype - Subtype (e.g., 'json')
 * @property {readonly string[]} extensions - Associated file extensions
 * @property {boolean} compressible - Whether content is compressible
 * @property {string} [charset] - Default character set
 * @property {FileCategory} category - File category classification
 * @property {string} description - Human-readable description
 */
export interface MimeTypeEntry {
  readonly type: string
  readonly subtype: string
  readonly extensions: readonly string[]
  readonly compressible: boolean
  readonly charset?: string
  readonly category: FileCategory
  readonly description: string
}

/**
 * Complete MIME type database with lookup maps
 *
 * @property {ReadonlyMap<string, MimeTypeEntry>} types - MIME type to entry map
 * @property {ReadonlyMap<string, readonly string[]>} extensions - Extension to MIME types map
 * @property {ReadonlyMap<FileCategory, readonly string[]>} categories - Category to MIME types map
 */
export interface MimeDatabase {
  readonly types: ReadonlyMap<string, MimeTypeEntry>
  readonly extensions: ReadonlyMap<string, readonly string[]>
  readonly categories: ReadonlyMap<FileCategory, readonly string[]>
}

// ========================================
// MIME Function Types
// ========================================

/** Factory function type for creating MIME operations */
export type CreateMimeOperations = (config?: MimeConfig) => MimeOperations

/** Function type for parsing MIME type strings into components */
export type MimeTypeParser = (mimeType: string) => FormatResult<{
  type: string
  subtype: string
  parameters: Record<string, string>
}>

/** Function type for resolving extensions to MIME types */
export type ExtensionResolver = (extension: string) => FormatResult<readonly string[]>

/** Function type for checking MIME type category membership */
export type CategoryChecker = (mimeType: string, category: FileCategory) => FormatResult<boolean>

// ========================================
// Common MIME Type Constants
// ========================================

/**
 * Common MIME type string constants organized by category
 *
 * Provides type-safe constants for frequently used MIME types to avoid
 * string literals and typos in application code.
 */
export const COMMON_MIME_TYPES = {
  // Images
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  GIF: 'image/gif',
  WEBP: 'image/webp',
  SVG: 'image/svg+xml',
  BMP: 'image/bmp',
  ICO: 'image/x-icon',
  TIFF: 'image/tiff',

  // Documents
  PDF: 'application/pdf',
  DOC: 'application/msword',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  XLS: 'application/vnd.ms-excel',
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  PPT: 'application/vnd.ms-powerpoint',
  PPTX: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',

  // Archives
  ZIP: 'application/zip',
  RAR: 'application/vnd.rar',
  TAR: 'application/x-tar',
  GZIP: 'application/gzip',
  SEVENZ: 'application/x-7z-compressed',

  // Audio
  MP3: 'audio/mpeg',
  WAV: 'audio/wav',
  FLAC: 'audio/flac',
  OGG: 'audio/ogg',
  M4A: 'audio/mp4',

  // Video
  MP4: 'video/mp4',
  AVI: 'video/x-msvideo',
  MOV: 'video/quicktime',
  WEBM: 'video/webm',
  MKV: 'video/x-matroska',

  // Text/Data
  TEXT: 'text/plain',
  HTML: 'text/html',
  CSS: 'text/css',
  JS: 'application/javascript',
  JSON: 'application/json',
  XML: 'application/xml',
  CSV: 'text/csv',
  YAML: 'application/x-yaml',

  // Application
  BINARY: 'application/octet-stream',
  FORM: 'application/x-www-form-urlencoded',
  MULTIPART: 'multipart/form-data',
} as const

/**
 * Mapping of file categories to their associated MIME types
 *
 * Used for category-based filtering and classification of MIME types.
 */
export const MIME_TYPE_CATEGORIES: Record<FileCategory, readonly string[]> = {
  image: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/x-icon',
    'image/tiff',
  ],
  video: [
    'video/mp4',
    'video/x-msvideo',
    'video/quicktime',
    'video/webm',
    'video/x-matroska',
    'video/x-flv',
  ],
  audio: [
    'audio/mpeg',
    'audio/wav',
    'audio/flac',
    'audio/ogg',
    'audio/mp4',
    'audio/x-ms-wma',
    'audio/aac',
  ],
  document: [
    'application/pdf',
    'application/msword',
    'text/plain',
    'text/html',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  archive: [
    'application/zip',
    'application/vnd.rar',
    'application/x-tar',
    'application/gzip',
    'application/x-7z-compressed',
    'application/x-bzip2',
  ],
  code: [
    'application/javascript',
    'text/css',
    'application/x-python',
    'text/x-java-source',
    'text/x-c',
    'text/x-csharp',
  ],
  data: [
    'application/json',
    'application/xml',
    'text/csv',
    'application/x-yaml',
    'application/toml',
    'text/x-ini',
  ],
  font: [
    'font/woff',
    'font/woff2',
    'font/truetype',
    'font/opentype',
    'application/font-woff',
    'application/x-font-ttf',
  ],
  executable: [
    'application/x-msdownload',
    'application/x-executable',
    'application/x-mach-binary',
    'application/x-dosexec',
  ],
  unknown: ['application/octet-stream'],
}
