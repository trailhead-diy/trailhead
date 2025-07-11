import type {
  ConversionConfig,
  ConversionOperations,
  FormatResult,
  ConversionInfo,
  ConversionQuality,
  FileCategory,
} from '../types.js';

// ========================================
// Conversion Configuration Defaults
// ========================================

export const defaultConversionConfig: Required<ConversionConfig> = {
  timeout: 30000,
  maxSize: 100 * 1024 * 1024, // 100MB
  strictMode: false,
  enableExtensionFallback: true,
  quality: 85,
  preserveMetadata: true,
} as const;

// ========================================
// Conversion Support Database
// ========================================

export interface ConversionRule {
  readonly fromFormat: string;
  readonly toFormat: string;
  readonly quality: ConversionQuality;
  readonly supported: boolean;
  readonly directConversion: boolean;
  readonly intermediateFormat?: string;
  readonly tools?: readonly string[];
  readonly limitations?: readonly string[];
}

export interface ConversionChain {
  readonly steps: readonly ConversionRule[];
  readonly quality: ConversionQuality;
  readonly estimatedTime: number;
  readonly requirements: readonly string[];
}

// ========================================
// Conversion Function Types
// ========================================

export type CreateConversionOperations = (config?: ConversionConfig) => ConversionOperations;

export type ConversionChecker = (
  fromFormat: string,
  toFormat: string
) => FormatResult<ConversionInfo>;

export type FormatLister = (category?: FileCategory) => FormatResult<readonly string[]>;

export type ChainBuilder = (
  fromFormat: string,
  toFormat: string
) => FormatResult<readonly string[]>;

export type QualityEstimator = (
  fromFormat: string,
  toFormat: string
) => FormatResult<ConversionQuality>;

// ========================================
// Format Categories for Conversion
// ========================================

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
} as const;

// ========================================
// Quality Definitions
// ========================================

export const QUALITY_DEFINITIONS: Record<
  ConversionQuality,
  {
    description: string;
    dataLoss: boolean;
    fidelity: number; // 0-1 scale
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
};
