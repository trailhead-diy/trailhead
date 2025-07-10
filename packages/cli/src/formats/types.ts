/**
 * Format utilities for file extensions, MIME types, and validation
 */

export type SupportedFormat = 'json' | 'json5' | 'yaml' | 'yml' | 'csv' | 'tsv' | 'xml' | 'toml';

export interface FormatInfo {
  readonly extensions: readonly string[];
  readonly mimeTypes: readonly string[];
  readonly description: string;
  readonly parser?: string;
  readonly binary?: boolean;
}

export interface FormatValidationResult {
  readonly isValid: boolean;
  readonly format?: SupportedFormat;
  readonly confidence: number;
  readonly errors: readonly string[];
}

export interface FormatDetectionOptions {
  readonly content?: string;
  readonly filename?: string;
  readonly strict?: boolean;
}

export type FormatValidator = (content: string) => FormatValidationResult;

export interface FormatRegistry {
  readonly [key: string]: FormatInfo;
}
