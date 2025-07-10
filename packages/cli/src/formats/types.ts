/**
 * Format detection types using file-type library with Result patterns
 */

import type { FileTypeResult } from 'file-type';

// Use file-type's comprehensive format support
export type SupportedFormat = string; // Any format file-type supports (80+)

export interface FormatDetectionResult extends FileTypeResult {
  readonly confidence: number;
  readonly detectionMethod: 'magic-number';
}

export interface FormatDetectionOptions {
  readonly sampleSize?: number;
  readonly mpegOffsetTolerance?: number;
}

export interface StreamDetectionOptions extends FormatDetectionOptions {
  readonly sampleSize?: number;
}

export interface AbortableOptions extends FormatDetectionOptions {
  readonly abortSignal?: AbortSignal;
}

// Simplified types - no custom detectors for now

// Legacy types for backward compatibility
export type FormatValidator = (content: string) => FormatValidationResult;

export interface FormatValidationResult {
  readonly isValid: boolean;
  readonly format?: SupportedFormat;
  readonly confidence: number;
  readonly errors: readonly string[];
}

export interface FormatInfo {
  readonly extensions: readonly string[];
  readonly mimeTypes: readonly string[];
  readonly description: string;
  readonly parser?: string;
  readonly binary?: boolean;
}

export interface FormatRegistry {
  readonly [key: string]: FormatInfo;
}
