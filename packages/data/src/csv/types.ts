import type {
  CSVConfig,
  CSVProcessingOptions,
  CSVOperations,
  DataResult,
  CSVFormatInfo,
} from '../types.js';

// ========================================
// CSV Configuration Defaults
// ========================================

export const defaultCSVConfig: Required<CSVConfig> = {
  delimiter: ',',
  quoteChar: '"',
  escapeChar: '"',
  hasHeader: true,
  dynamicTyping: false,
  comments: '',
  skipEmptyLines: true,
  encoding: 'utf8',
  timeout: 30000,
  maxSize: 50 * 1024 * 1024, // 50MB
  transform: (value: string) => value,
  transformHeader: (header: string) => header.trim(),
  detectDelimiter: false,
} as const;

// ========================================
// CSV Processing Types
// ========================================

export interface CSVParseResult {
  readonly data: any[];
  readonly errors: any[];
  readonly meta: {
    readonly delimiter: string;
    readonly linebreak: string;
    readonly aborted: boolean;
    readonly truncated: boolean;
    readonly cursor: number;
    readonly fields?: string[];
  };
}

export interface CSVStringifyOptions {
  readonly delimiter?: string;
  readonly quoteChar?: string;
  readonly escapeChar?: string;
  readonly header?: boolean;
  readonly columns?: string[];
  readonly skipEmptyLines?: boolean;
  readonly transform?: (value: any, field: string) => string;
}

// ========================================
// CSV Operations Function Types
// ========================================

export type CSVConfigProvider = () => CSVConfig;
export type CSVParseFunction = (data: string, options?: CSVProcessingOptions) => DataResult<any[]>;
export type CSVParseFileFunction = (
  filePath: string,
  options?: CSVProcessingOptions
) => Promise<DataResult<any[]>>;
export type CSVStringifyFunction = (
  data: any[],
  options?: CSVProcessingOptions
) => DataResult<string>;
export type CSVWriteFileFunction = (
  data: any[],
  filePath: string,
  options?: CSVProcessingOptions
) => Promise<DataResult<void>>;
export type CSVValidateFunction = (data: string) => DataResult<boolean>;
export type CSVDetectFormatFunction = (data: string) => DataResult<CSVFormatInfo>;

// ========================================
// CSV Factory Function Type
// ========================================

export type CreateCSVOperations = (config?: CSVConfig) => CSVOperations;
