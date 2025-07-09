import type { Result } from '../core/errors/types.js';
import type { CLIError } from '../core/errors/types.js';

export interface DataProcessingOptions {
  autoTrim?: boolean;
  skipEmptyLines?: boolean;
  errorTolerant?: boolean;
  maxRows?: number;
  onError?: (error: CLIError, context?: any) => void;
}

export interface CSVProcessingOptions extends DataProcessingOptions {
  delimiter?: string;
  quoteChar?: string;
  escapeChar?: string;
  hasHeader?: boolean;
  dynamicTyping?: boolean;
  transformHeader?: (header: string) => string;
  detectDelimiter?: boolean;
  comments?: string;
  transform?: (value: string, field: string) => any;
}

export interface JSONProcessingOptions extends DataProcessingOptions {
  allowTrailingCommas?: boolean;
  allowComments?: boolean;
  allowSingleQuotes?: boolean;
  allowUnquotedKeys?: boolean;
  reviver?: (key: string, value: any) => any;
}

export interface ExcelProcessingOptions extends DataProcessingOptions {
  worksheetName?: string;
  worksheetIndex?: number;
  hasHeader?: boolean;
  dynamicTyping?: boolean;
  dateNF?: string; // Date number format
  cellNF?: boolean; // Include cell number format
  defval?: any; // Default value for empty cells
  range?: string; // Cell range to read (e.g., 'A1:D10')
  header?: number; // Header row number (0-based)
  password?: string; // For encrypted files
  bookSST?: boolean; // Save strings to shared string table
  cellHTML?: boolean; // Parse rich text as HTML
  cellStyles?: boolean; // Include cell styles
  cellDates?: boolean; // Parse dates
  sheetStubs?: boolean; // Create cell objects for stub cells
  blankrows?: boolean; // Include blank rows
  bookVBA?: boolean; // Include VBA macros if present
}

export interface FormatDetectionResult {
  format: 'csv' | 'json' | 'excel' | 'unknown';
  confidence: number;
  details?: {
    delimiter?: string;
    hasHeader?: boolean;
    structure?: string;
    worksheetNames?: string[];
    worksheetCount?: number;
  };
}

export interface CSVProcessor {
  parseString(data: string, options?: CSVProcessingOptions): Result<any[], CLIError>;
  parseFile(filePath: string, options?: CSVProcessingOptions): Promise<Result<any[], CLIError>>;
  stringify(data: any[], options?: CSVProcessingOptions): Result<string, CLIError>;
  writeFile(
    data: any[],
    filePath: string,
    options?: CSVProcessingOptions
  ): Promise<Result<void, CLIError>>;
  validate(data: string): Result<boolean, CLIError>;
  detectFormat(
    data: string
  ): Result<
    {
      delimiter: string;
      quoteChar: string;
      hasHeader: boolean;
      rowCount: number;
      columnCount: number;
    },
    CLIError
  >;
  parseToObjects(
    data: string,
    options?: CSVProcessingOptions
  ): Result<Record<string, any>[], CLIError>;
  parseToArrays(data: string, options?: CSVProcessingOptions): Result<string[][], CLIError>;
  fromObjects(
    objects: Record<string, any>[],
    options?: CSVProcessingOptions
  ): Result<string, CLIError>;
  fromArrays(arrays: string[][], options?: CSVProcessingOptions): Result<string, CLIError>;
}

export interface JSONProcessor {
  parseString(data: string, options?: JSONProcessingOptions): Result<any, CLIError>;
  parseFile(filePath: string, options?: JSONProcessingOptions): Promise<Result<any, CLIError>>;
  stringify(data: any, options?: JSONProcessingOptions): Result<string, CLIError>;
  writeFile(
    data: any,
    filePath: string,
    options?: JSONProcessingOptions
  ): Promise<Result<void, CLIError>>;
  validate(data: string): Result<boolean, CLIError>;
  parseEnhanced(data: string, options?: JSONProcessingOptions): Result<any, CLIError>;
  stringifyFormatted(
    data: any,
    options?: { indent?: number; sortKeys?: boolean }
  ): Result<string, CLIError>;
  validateJSON(data: string): Result<boolean, CLIError>;
  minify(data: string): Result<string, CLIError>;
}

export interface ExcelProcessor {
  parseBuffer(buffer: Buffer, options?: ExcelProcessingOptions): Result<any[], CLIError>;
  parseFile(filePath: string, options?: ExcelProcessingOptions): Promise<Result<any[], CLIError>>;
  parseWorksheet(
    buffer: Buffer,
    worksheetName: string,
    options?: ExcelProcessingOptions
  ): Result<any[], CLIError>;
  parseWorksheetByIndex(
    buffer: Buffer,
    worksheetIndex: number,
    options?: ExcelProcessingOptions
  ): Result<any[], CLIError>;
  stringify(data: any[], options?: ExcelProcessingOptions): Promise<Result<Buffer, CLIError>>;
  writeFile(
    data: any[],
    filePath: string,
    options?: ExcelProcessingOptions
  ): Promise<Result<void, CLIError>>;
  validate(buffer: Buffer): Result<boolean, CLIError>;
  detectFormat(
    buffer: Buffer
  ): Result<{ worksheetNames: string[]; worksheetCount: number; hasData: boolean }, CLIError>;
  parseToObjects(
    buffer: Buffer,
    options?: ExcelProcessingOptions
  ): Result<Record<string, any>[], CLIError>;
  parseToArrays(buffer: Buffer, options?: ExcelProcessingOptions): Result<any[][], CLIError>;
  fromObjects(
    objects: Record<string, any>[],
    options?: ExcelProcessingOptions
  ): Promise<Result<Buffer, CLIError>>;
  fromArrays(arrays: any[][], options?: ExcelProcessingOptions): Promise<Result<Buffer, CLIError>>;
  getWorksheetNames(buffer: Buffer): Result<string[], CLIError>;
  createWorkbook(worksheets: { name: string; data: any[][] }[]): Promise<Result<Buffer, CLIError>>;
}

export interface DataConverter {
  convert(
    data: string | Buffer,
    fromFormat: 'csv' | 'json' | 'excel',
    toFormat: 'csv' | 'json' | 'excel',
    options?: DataProcessingOptions
  ): Promise<Result<string | Buffer, CLIError>>;

  autoConvert(
    data: string | Buffer,
    toFormat: 'csv' | 'json' | 'excel',
    options?: DataProcessingOptions
  ): Promise<Result<string | Buffer, CLIError>>;
}
