import type { Result, CoreError } from '@trailhead/core';

// ========================================
// Configuration Types
// ========================================

export interface DataConfig {
  readonly encoding?: BufferEncoding;
  readonly timeout?: number;
  readonly maxSize?: number;
}

export interface CSVConfig extends DataConfig {
  readonly delimiter?: string;
  readonly quoteChar?: string;
  readonly escapeChar?: string;
  readonly hasHeader?: boolean;
  readonly dynamicTyping?: boolean;
  readonly comments?: string;
  readonly skipEmptyLines?: boolean;
  readonly transform?: (value: string, field: string) => any;
  readonly transformHeader?: (header: string) => string;
  readonly detectDelimiter?: boolean;
}

export interface JSONConfig extends DataConfig {
  readonly reviver?: (key: string, value: any) => any;
  readonly replacer?: (key: string, value: any) => any;
  readonly space?: string | number;
  readonly allowTrailingCommas?: boolean;
  readonly allowComments?: boolean;
}

export interface ExcelConfig extends DataConfig {
  readonly worksheetName?: string;
  readonly worksheetIndex?: number;
  readonly hasHeader?: boolean;
  readonly dynamicTyping?: boolean;
  readonly dateNF?: string;
  readonly range?: string;
  readonly header?: number;
  readonly cellDates?: boolean;
  readonly defval?: any;
}

// ========================================
// Processing Options Types
// ========================================

export interface ProcessingOptions {
  readonly autoTrim?: boolean;
  readonly skipEmptyLines?: boolean;
  readonly errorTolerant?: boolean;
  readonly maxRows?: number;
  readonly onError?: (error: CoreError, context?: Record<string, unknown>) => void;
}

export interface CSVProcessingOptions extends ProcessingOptions {
  readonly delimiter?: string;
  readonly quoteChar?: string;
  readonly escapeChar?: string;
  readonly hasHeader?: boolean;
  readonly dynamicTyping?: boolean;
  readonly transformHeader?: (header: string) => string;
  readonly detectDelimiter?: boolean;
  readonly comments?: string;
  readonly transform?: (value: string, field: string) => any;
}

export interface JSONProcessingOptions extends ProcessingOptions {
  readonly allowTrailingCommas?: boolean;
  readonly allowComments?: boolean;
  readonly allowSingleQuotes?: boolean;
  readonly allowUnquotedKeys?: boolean;
  readonly reviver?: (key: string, value: any) => any;
  readonly replacer?: (key: string, value: any) => any;
  readonly space?: string | number;
}

export interface ExcelProcessingOptions extends ProcessingOptions {
  readonly worksheetName?: string;
  readonly worksheetIndex?: number;
  readonly hasHeader?: boolean;
  readonly dynamicTyping?: boolean;
  readonly dateNF?: string;
  readonly cellNF?: boolean;
  readonly defval?: any;
  readonly range?: string;
  readonly header?: number;
  readonly password?: string;
  readonly bookSST?: boolean;
  readonly cellHTML?: boolean;
  readonly cellStyles?: boolean;
  readonly cellDates?: boolean;
  readonly sheetStubs?: boolean;
  readonly blankrows?: boolean;
  readonly bookVBA?: boolean;
}

// ========================================
// Result Types
// ========================================

export type DataResult<T> = Result<T, CoreError>;

export interface FormatDetectionResult {
  readonly format: 'csv' | 'json' | 'excel' | 'unknown';
  readonly confidence: number;
  readonly details?: {
    readonly delimiter?: string;
    readonly hasHeader?: boolean;
    readonly structure?: string;
    readonly worksheetNames?: string[];
    readonly worksheetCount?: number;
  };
}

export interface CSVFormatInfo {
  readonly delimiter: string;
  readonly quoteChar: string;
  readonly hasHeader: boolean;
  readonly rowCount: number;
  readonly columnCount: number;
}

export interface ExcelFormatInfo {
  readonly worksheetNames: string[];
  readonly worksheetCount: number;
  readonly hasData: boolean;
}

// ========================================
// Operational Types
// ========================================

export type ParseOperation<T, O = ProcessingOptions> = (data: string, options?: O) => DataResult<T>;
export type ParseFileOperation<T, O = ProcessingOptions> = (
  filePath: string,
  options?: O
) => Promise<DataResult<T>>;
export type StringifyOperation<T, O = ProcessingOptions> = (
  data: T,
  options?: O
) => DataResult<string>;
export type WriteFileOperation<T, O = ProcessingOptions> = (
  data: T,
  filePath: string,
  options?: O
) => Promise<DataResult<void>>;
export type ValidateOperation = (data: string | Buffer) => DataResult<boolean>;
export type ValidateStringOperation = (data: string) => DataResult<boolean>;
export type ValidateBufferOperation = (data: Buffer) => DataResult<boolean>;

// ========================================
// Processor Function Types
// ========================================

export interface CSVOperations {
  readonly parseString: ParseOperation<any[], CSVProcessingOptions>;
  readonly parseFile: ParseFileOperation<any[], CSVProcessingOptions>;
  readonly stringify: StringifyOperation<any[], CSVProcessingOptions>;
  readonly writeFile: WriteFileOperation<any[], CSVProcessingOptions>;
  readonly validate: ValidateStringOperation;
  readonly detectFormat: (data: string) => DataResult<CSVFormatInfo>;
  readonly parseToObjects: ParseOperation<Record<string, any>[], CSVProcessingOptions>;
  readonly parseToArrays: ParseOperation<string[][], CSVProcessingOptions>;
  readonly fromObjects: StringifyOperation<Record<string, any>[], CSVProcessingOptions>;
  readonly fromArrays: StringifyOperation<string[][], CSVProcessingOptions>;
}

export interface JSONOperations {
  readonly parseString: ParseOperation<any, JSONProcessingOptions>;
  readonly parseFile: ParseFileOperation<any, JSONProcessingOptions>;
  readonly stringify: StringifyOperation<any, JSONProcessingOptions>;
  readonly writeFile: WriteFileOperation<any, JSONProcessingOptions>;
  readonly validate: ValidateStringOperation;
  readonly minify: (data: string) => DataResult<string>;
  readonly format: (
    data: string,
    options?: { indent?: number; sortKeys?: boolean }
  ) => DataResult<string>;
}

export interface ExcelOperations {
  readonly parseBuffer: (buffer: Buffer, options?: ExcelProcessingOptions) => DataResult<any[]>;
  readonly parseFile: ParseFileOperation<any[], ExcelProcessingOptions>;
  readonly parseWorksheet: (
    buffer: Buffer,
    worksheetName: string,
    options?: ExcelProcessingOptions
  ) => DataResult<any[]>;
  readonly parseWorksheetByIndex: (
    buffer: Buffer,
    worksheetIndex: number,
    options?: ExcelProcessingOptions
  ) => DataResult<any[]>;
  readonly stringify: (
    data: any[],
    options?: ExcelProcessingOptions
  ) => Promise<DataResult<Buffer>>;
  readonly writeFile: WriteFileOperation<any[], ExcelProcessingOptions>;
  readonly validate: ValidateBufferOperation;
  readonly detectFormat: (buffer: Buffer) => DataResult<ExcelFormatInfo>;
  readonly parseToObjects: (
    buffer: Buffer,
    options?: ExcelProcessingOptions
  ) => DataResult<Record<string, any>[]>;
  readonly parseToArrays: (buffer: Buffer, options?: ExcelProcessingOptions) => DataResult<any[][]>;
  readonly fromObjects: (
    objects: Record<string, any>[],
    options?: ExcelProcessingOptions
  ) => Promise<DataResult<Buffer>>;
  readonly fromArrays: (
    arrays: any[][],
    options?: ExcelProcessingOptions
  ) => Promise<DataResult<Buffer>>;
  readonly getWorksheetNames: (buffer: Buffer) => DataResult<string[]>;
  readonly createWorkbook: (
    worksheets: { name: string; data: any[][] }[]
  ) => Promise<DataResult<Buffer>>;
}
