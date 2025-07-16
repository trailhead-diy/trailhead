import type { MimeConfig, MimeOperations, FormatResult, FileCategory } from '../formats-types.js'

// ========================================
// MIME Configuration Defaults
// ========================================

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

export interface MimeTypeEntry {
  readonly type: string
  readonly subtype: string
  readonly extensions: readonly string[]
  readonly compressible: boolean
  readonly charset?: string
  readonly category: FileCategory
  readonly description: string
}

export interface MimeDatabase {
  readonly types: ReadonlyMap<string, MimeTypeEntry>
  readonly extensions: ReadonlyMap<string, readonly string[]>
  readonly categories: ReadonlyMap<FileCategory, readonly string[]>
}

// ========================================
// MIME Function Types
// ========================================

export type CreateMimeOperations = (config?: MimeConfig) => MimeOperations

export type MimeTypeParser = (mimeType: string) => FormatResult<{
  type: string
  subtype: string
  parameters: Record<string, string>
}>

export type ExtensionResolver = (extension: string) => FormatResult<readonly string[]>

export type CategoryChecker = (mimeType: string, category: FileCategory) => FormatResult<boolean>

// ========================================
// Common MIME Type Constants
// ========================================

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
