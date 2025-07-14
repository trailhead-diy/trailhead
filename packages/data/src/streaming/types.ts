import type { Result, CoreError } from '@esteban-url/core';
import type { Readable, Writable, Transform } from 'node:stream';
import type {
  CSVProcessingOptions,
  JSONProcessingOptions,
  ExcelProcessingOptions,
} from '../types.js';

// ========================================
// Core Streaming Types
// ========================================

export type StreamResult<T> = Result<T, CoreError>;

// Base streaming configuration extending existing processing options
export interface StreamingConfig {
  readonly enabled?: boolean;
  readonly chunkSize?: number;
  readonly highWaterMark?: number;
  readonly objectMode?: boolean;
  readonly timeout?: number;
  readonly onProgress?: (processed: number, total?: number) => void;
  readonly onError?: (error: CoreError, context?: Record<string, unknown>) => void;
}

// Format-specific streaming configurations extending base processing options
export interface StreamingCSVConfig extends CSVProcessingOptions, StreamingConfig {
  readonly batchSize?: number;
  readonly parseStep?: (results: any, parser: any) => void;
}

export interface StreamingJSONConfig extends JSONProcessingOptions, StreamingConfig {
  readonly arrayPath?: string;
  readonly streamArray?: boolean;
}

export interface StreamingExcelConfig extends ExcelProcessingOptions, StreamingConfig {
  readonly rowBatch?: number;
}

// ========================================
// Stream Operations Interface
// ========================================

export interface StreamOperations {
  readonly createReadableFromArray: <T>(data: T[]) => StreamResult<Readable>;
  readonly createWritableToArray: <T>() => StreamResult<{ stream: Writable; getArray: () => T[] }>;
  readonly createTransform: <T, U>(transform: (chunk: T) => U) => StreamResult<Transform>;
  readonly pipeline: (
    ...streams: (Readable | Writable | Transform)[]
  ) => Promise<StreamResult<void>>;
}

// ========================================
// CSV Streaming Operations
// ========================================

export interface CSVStreamingOperations {
  readonly parseFileStream: (
    filePath: string,
    options?: StreamingCSVConfig
  ) => Promise<StreamResult<Readable>>;
  readonly parseStringStream: (
    data: string,
    options?: StreamingCSVConfig
  ) => StreamResult<Readable>;
  readonly writeFileStream: (
    filePath: string,
    options?: StreamingCSVConfig
  ) => StreamResult<Writable>;
  readonly transformStream: <T, U>(
    transform: (row: T) => U,
    options?: StreamingCSVConfig
  ) => StreamResult<Transform>;
  readonly stringifyStream: (options?: StreamingCSVConfig) => StreamResult<Transform>;
  readonly validateStream: (options?: StreamingCSVConfig) => StreamResult<Transform>;
}

// ========================================
// JSON Streaming Operations
// ========================================

export interface JSONStreamingOperations {
  readonly parseFileStream: (
    filePath: string,
    options?: StreamingJSONConfig
  ) => Promise<StreamResult<Readable>>;
  readonly parseArrayStream: (
    data: string,
    options?: StreamingJSONConfig
  ) => StreamResult<Readable>;
  readonly writeFileStream: (
    filePath: string,
    options?: StreamingJSONConfig
  ) => StreamResult<Writable>;
  readonly stringifyArrayStream: (options?: StreamingJSONConfig) => StreamResult<Transform>;
  readonly transformStream: <T, U>(
    transform: (item: T) => U,
    options?: StreamingJSONConfig
  ) => StreamResult<Transform>;
  readonly validateStream: (options?: StreamingJSONConfig) => StreamResult<Transform>;
}

// ========================================
// Excel Streaming Operations
// ========================================

export interface ExcelStreamingOperations {
  readonly parseFileStream: (
    filePath: string,
    options?: StreamingExcelConfig
  ) => Promise<StreamResult<Readable>>;
  readonly parseWorksheetStream: (
    buffer: Buffer,
    options?: StreamingExcelConfig
  ) => StreamResult<Readable>;
  readonly writeFileStream: (
    filePath: string,
    options?: StreamingExcelConfig
  ) => StreamResult<Writable>;
  readonly transformRowStream: <T, U>(
    transform: (row: T) => U,
    options?: StreamingExcelConfig
  ) => StreamResult<Transform>;
  readonly stringifyWorksheetStream: (options?: StreamingExcelConfig) => StreamResult<Transform>;
}

// ========================================
// Combined Streaming Operations
// ========================================

export interface DataStreamingOperations {
  readonly csv: CSVStreamingOperations;
  readonly json: JSONStreamingOperations;
  readonly excel: ExcelStreamingOperations;
  readonly stream: StreamOperations;
}

// ========================================
// Factory Types
// ========================================

export type CreateCSVStreamingOperations = (
  streamOps: StreamOperations,
  config?: StreamingCSVConfig
) => CSVStreamingOperations;

export type CreateJSONStreamingOperations = (
  streamOps: StreamOperations,
  config?: StreamingJSONConfig
) => JSONStreamingOperations;

export type CreateExcelStreamingOperations = (
  streamOps: StreamOperations,
  config?: StreamingExcelConfig
) => ExcelStreamingOperations;

export type CreateDataStreamingOperations = (
  streamOps?: StreamOperations,
  config?: StreamingConfig
) => Promise<StreamResult<DataStreamingOperations>>;

// ========================================
// Progress and Metrics Types
// ========================================

export interface StreamProgress {
  readonly processed: number;
  readonly total?: number;
  readonly percentage?: number;
  readonly bytesProcessed: number;
  readonly bytesTotal?: number;
  readonly startTime: Date;
  readonly elapsedMs: number;
  readonly estimatedRemainingMs?: number;
}

export interface StreamMetrics {
  readonly rowsProcessed: number;
  readonly errorsEncountered: number;
  readonly bytesProcessed: number;
  readonly processingRate: number; // rows per second
  readonly memoryUsage: NodeJS.MemoryUsage;
}

// ========================================
// Stream Event Types
// ========================================

export interface StreamEventHandlers {
  readonly onProgress?: (progress: StreamProgress) => void;
  readonly onMetrics?: (metrics: StreamMetrics) => void;
  readonly onError?: (error: CoreError, context?: Record<string, unknown>) => void;
  readonly onComplete?: (metrics: StreamMetrics) => void;
}
