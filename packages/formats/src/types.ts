import type { Result, CoreError } from '@esteban-url/core'

// ========================================
// Configuration Types
// ========================================

export interface FormatConfig {
  readonly timeout?: number
  readonly maxSize?: number
  readonly strictMode?: boolean
  readonly enableExtensionFallback?: boolean
}

export interface DetectionConfig extends FormatConfig {
  readonly bufferSize?: number
  readonly useFileExtension?: boolean
  readonly useMagicNumbers?: boolean
}

export interface MimeConfig extends FormatConfig {
  readonly charset?: string
  readonly defaultMimeType?: string
}

export interface ConversionConfig extends FormatConfig {
  readonly quality?: number
  readonly preserveMetadata?: boolean
}

// ========================================
// Result Types
// ========================================

export type FormatResult<T> = Result<T, CoreError>

// ========================================
// File Format Types
// ========================================

export interface FileFormatInfo {
  readonly ext: string
  readonly mime: string
  readonly description: string
  readonly category: FileCategory
  readonly confidence: number
  readonly details?: FormatDetails
}

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

export interface DetectionResult {
  readonly format: FileFormatInfo
  readonly source: DetectionSource
  readonly reliability: DetectionReliability
}

export type DetectionSource =
  | 'magic-numbers'
  | 'file-extension'
  | 'mime-header'
  | 'content-analysis'
  | 'metadata'

export type DetectionReliability = 'high' | 'medium' | 'low'

// ========================================
// MIME Types
// ========================================

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

export interface ConversionInfo {
  readonly fromFormat: string
  readonly toFormat: string
  readonly supported: boolean
  readonly quality: ConversionQuality
  readonly options?: ConversionOptions
}

export type ConversionQuality = 'lossless' | 'lossy' | 'transcode'

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

export type DetectFromBufferOp = (
  buffer: Buffer,
  config?: DetectionConfig
) => Promise<FormatResult<DetectionResult>>
export type DetectFromFileOp = (
  filePath: string,
  config?: DetectionConfig
) => Promise<FormatResult<DetectionResult>>
export type DetectFromExtensionOp = (
  extension: string,
  config?: DetectionConfig
) => FormatResult<FileFormatInfo>

export type GetMimeTypeOp = (
  input: string | Buffer,
  config?: MimeConfig
) => FormatResult<MimeTypeInfo>
export type GetExtensionsOp = (
  mimeType: string,
  config?: MimeConfig
) => FormatResult<readonly string[]>
export type IsMimeTypeOp = (mimeType: string, category: FileCategory) => FormatResult<boolean>

export type CheckConversionOp = (
  fromFormat: string,
  toFormat: string
) => FormatResult<ConversionInfo>
export type GetSupportedFormatsOp = (category?: FileCategory) => FormatResult<readonly string[]>

// ========================================
// Operations Interfaces
// ========================================

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

export interface MimeOperations {
  readonly getMimeType: GetMimeTypeOp
  readonly getExtensions: GetExtensionsOp
  readonly isMimeType: IsMimeTypeOp
  readonly normalizeMimeType: (mimeType: string) => FormatResult<string>
  readonly parseMimeType: (mimeType: string) => FormatResult<MimeTypeInfo>
}

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
