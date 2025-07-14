import type {
  DetectionConfig,
  DetectionOperations,
  FormatResult,
  DetectionResult,
  FileFormatInfo,
  DetectionReliability,
} from '../types.js'

// ========================================
// Detection Configuration Defaults
// ========================================

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

export interface MagicNumberPattern {
  readonly signature: Uint8Array
  readonly offset: number
  readonly mask?: Uint8Array
  readonly format: FileFormatInfo
}

export interface ExtensionMapping {
  readonly extension: string
  readonly format: FileFormatInfo
  readonly reliability: DetectionReliability
}

// ========================================
// Detection Function Types
// ========================================

export type CreateDetectionOperations = (config?: DetectionConfig) => DetectionOperations

export type DetectionStrategy = (
  input: Buffer | string,
  config: DetectionConfig
) => FormatResult<DetectionResult>

export type MagicNumberDetector = (
  buffer: Buffer,
  config: DetectionConfig
) => FormatResult<DetectionResult>

export type ExtensionDetector = (
  filename: string,
  config: DetectionConfig
) => FormatResult<DetectionResult>

// ========================================
// Format Database Types
// ========================================

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
