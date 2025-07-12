import type { Result } from '@trailhead/core';
import type { TrailheadError } from '@trailhead/core/errors';
import type { Readable, Writable, Transform, Duplex } from 'node:stream';

// ========================================
// Result Type Alias
// ========================================

export type StreamResult<T> = Result<T, TrailheadError>;

// ========================================
// Configuration Types
// ========================================

export interface StreamConfig {
  readonly timeout?: number;
  readonly highWaterMark?: number;
  readonly objectMode?: boolean;
  readonly encoding?: BufferEncoding;
  readonly autoDestroy?: boolean;
}

export interface ReadableConfig extends StreamConfig {
  readonly read?: (size: number) => void;
}

export interface WritableConfig extends StreamConfig {
  readonly write?: (
    chunk: any,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void
  ) => void;
  readonly final?: (callback: (error?: Error | null) => void) => void;
}

export interface TransformConfig extends StreamConfig {
  readonly transform?: (chunk: any, encoding: BufferEncoding, callback: TransformCallback) => void;
  readonly flush?: (callback: TransformCallback) => void;
}

export interface DuplexConfig extends StreamConfig {
  readonly read?: (size: number) => void;
  readonly write?: (
    chunk: any,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void
  ) => void;
  readonly final?: (callback: (error?: Error | null) => void) => void;
  readonly allowHalfOpen?: boolean;
}

// ========================================
// Stream Operation Types
// ========================================

export type TransformCallback = (error?: Error | null, data?: any) => void;

export type StreamProcessor<T, R> = (data: T) => StreamResult<R>;
export type AsyncStreamProcessor<T, R> = (data: T) => Promise<StreamResult<R>>;

export type StreamPredicate<T> = (data: T) => boolean;
export type AsyncStreamPredicate<T> = (data: T) => Promise<boolean>;

export type StreamAccumulator<T, R> = (accumulator: R, current: T) => R;
export type AsyncStreamAccumulator<T, R> = (accumulator: R, current: T) => Promise<R>;

// ========================================
// Stream Information Types
// ========================================

export interface StreamInfo {
  readonly readable: boolean;
  readonly writable: boolean;
  readonly destroyed: boolean;
  readonly ended: boolean;
  readonly finished: boolean;
  readonly readableFlowing: boolean | null;
  readonly readableHighWaterMark: number;
  readonly writableHighWaterMark: number;
  readonly readableLength: number;
  readonly writableLength: number;
}

// ========================================
// Pipeline Types
// ========================================

export interface PipelineOptions {
  readonly signal?: AbortSignal;
  readonly end?: boolean;
}

export type PipelineStream = Readable | Writable | Transform | Duplex;

// ========================================
// Batch Processing Types
// ========================================

export interface BatchConfig {
  readonly batchSize: number;
  readonly maxConcurrency?: number;
  readonly flushTimeout?: number;
}

export interface StreamMetrics {
  readonly bytesRead: number;
  readonly bytesWritten: number;
  readonly chunksProcessed: number;
  readonly errorsEncountered: number;
  readonly processingTimeMs: number;
}

// ========================================
// Functional Operation Types
// ========================================

export type CreateReadableStream<_T> = (config?: ReadableConfig) => StreamResult<Readable>;
export type CreateWritableStream<_T> = (config?: WritableConfig) => StreamResult<Writable>;
export type CreateTransformStream<T, R> = (
  processor: StreamProcessor<T, R> | AsyncStreamProcessor<T, R>,
  config?: TransformConfig
) => StreamResult<Transform>;
export type CreateDuplexStream<_T, _R> = (config?: DuplexConfig) => StreamResult<Duplex>;

export type PipelineOp = (
  streams: PipelineStream[],
  options?: PipelineOptions
) => Promise<StreamResult<void>>;
export type StreamToArrayOp<T> = (stream: Readable) => Promise<StreamResult<T[]>>;
export type ArrayToStreamOp<T> = (array: T[], config?: ReadableConfig) => StreamResult<Readable>;

// ========================================
// Operations Interfaces
// ========================================

export interface ReadableOperations {
  readonly createFromArray: <T>(data: T[], config?: ReadableConfig) => StreamResult<Readable>;
  readonly createFromIterator: <T>(
    iterator: Iterable<T>,
    config?: ReadableConfig
  ) => StreamResult<Readable>;
  readonly createFromAsyncIterator: <T>(
    iterator: AsyncIterable<T>,
    config?: ReadableConfig
  ) => StreamResult<Readable>;
  readonly toArray: <T>(stream: Readable) => Promise<StreamResult<T[]>>;
  readonly forEach: <T>(
    stream: Readable,
    fn: StreamProcessor<T, void> | AsyncStreamProcessor<T, void>
  ) => Promise<StreamResult<void>>;
  readonly filter: <T>(
    stream: Readable,
    predicate: StreamPredicate<T> | AsyncStreamPredicate<T>
  ) => StreamResult<Readable>;
  readonly map: <T, R>(
    stream: Readable,
    mapper: StreamProcessor<T, R> | AsyncStreamProcessor<T, R>
  ) => StreamResult<Readable>;
  readonly reduce: <T, R>(
    stream: Readable,
    reducer: StreamAccumulator<T, R> | AsyncStreamAccumulator<T, R>,
    initialValue: R
  ) => Promise<StreamResult<R>>;
}

export interface WritableOperations {
  readonly createToArray: <T>(target: T[], config?: WritableConfig) => StreamResult<Writable>;
  readonly createToCallback: <T>(
    callback: (data: T) => void | Promise<void>,
    config?: WritableConfig
  ) => StreamResult<Writable>;
  readonly writeAll: <T>(stream: Writable, data: T[]) => Promise<StreamResult<void>>;
  readonly end: (stream: Writable) => Promise<StreamResult<void>>;
}

export interface TransformOperations {
  readonly map: <T, R>(
    mapper: StreamProcessor<T, R> | AsyncStreamProcessor<T, R>,
    config?: TransformConfig
  ) => StreamResult<Transform>;
  readonly filter: <T>(
    predicate: StreamPredicate<T> | AsyncStreamPredicate<T>,
    config?: TransformConfig
  ) => StreamResult<Transform>;
  readonly batch: <_T>(
    batchConfig: BatchConfig,
    config?: TransformConfig
  ) => StreamResult<Transform>;
  readonly debounce: <_T>(delayMs: number, config?: TransformConfig) => StreamResult<Transform>;
  readonly throttle: <_T>(intervalMs: number, config?: TransformConfig) => StreamResult<Transform>;
  readonly compress: (config?: TransformConfig) => StreamResult<Transform>;
  readonly decompress: (config?: TransformConfig) => StreamResult<Transform>;
}

export interface DuplexOperations {
  readonly createEcho: (config?: DuplexConfig) => StreamResult<Duplex>;
  readonly createBuffer: <_T>(bufferSize: number, config?: DuplexConfig) => StreamResult<Duplex>;
  readonly createPassThrough: (config?: DuplexConfig) => StreamResult<Duplex>;
}

export interface PipelineOperations {
  readonly pipeline: PipelineOp;
  readonly compose: (...streams: PipelineStream[]) => StreamResult<PipelineStream>;
  readonly split: <_T>(
    stream: Readable,
    ...destinations: Writable[]
  ) => Promise<StreamResult<void>>;
  readonly merge: (...streams: Readable[]) => StreamResult<Readable>;
}
