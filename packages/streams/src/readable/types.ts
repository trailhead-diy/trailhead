import type {
  ReadableConfig,
  ReadableOperations,
  StreamResult,
  StreamProcessor,
  AsyncStreamProcessor,
  StreamPredicate,
  AsyncStreamPredicate,
  StreamAccumulator,
  AsyncStreamAccumulator,
} from '../types.js';
import type { Readable } from 'node:stream';

// ========================================
// Readable Configuration Defaults
// ========================================

export const defaultReadableConfig: Required<ReadableConfig> = {
  timeout: 30000,
  highWaterMark: 16384,
  objectMode: false,
  encoding: 'utf8',
  autoDestroy: true,
  read: () => {}, // Default no-op read implementation
};

// ========================================
// Readable Stream Creation Types
// ========================================

export type CreateReadableOperations = (config?: ReadableConfig) => ReadableOperations;

export interface ReadableStreamOptions {
  readonly highWaterMark?: number;
  readonly objectMode?: boolean;
  readonly encoding?: BufferEncoding;
  readonly autoDestroy?: boolean;
  readonly signal?: AbortSignal;
}

// ========================================
// Data Source Types
// ========================================

export interface IteratorSource<T> {
  readonly type: 'iterator';
  readonly data: Iterable<T>;
}

export interface AsyncIteratorSource<T> {
  readonly type: 'async-iterator';
  readonly data: AsyncIterable<T>;
}

export interface ArraySource<T> {
  readonly type: 'array';
  readonly data: T[];
}

export interface GeneratorSource<T> {
  readonly type: 'generator';
  readonly generator: () => Generator<T>;
}

export interface AsyncGeneratorSource<T> {
  readonly type: 'async-generator';
  readonly generator: () => AsyncGenerator<T>;
}

export type StreamSource<T> = 
  | IteratorSource<T>
  | AsyncIteratorSource<T>
  | ArraySource<T>
  | GeneratorSource<T>
  | AsyncGeneratorSource<T>;

// ========================================
// Readable Stream Operation Types
// ========================================

export type ReadableFromArrayOp = <T>(data: T[], config?: ReadableConfig) => StreamResult<Readable>;
export type ReadableFromIteratorOp = <T>(iterator: Iterable<T>, config?: ReadableConfig) => StreamResult<Readable>;
export type ReadableFromAsyncIteratorOp = <T>(iterator: AsyncIterable<T>, config?: ReadableConfig) => StreamResult<Readable>;

export type ReadableToArrayOp = <T>(stream: Readable) => Promise<StreamResult<T[]>>;
export type ReadableForEachOp = <T>(
  stream: Readable,
  fn: StreamProcessor<T, void> | AsyncStreamProcessor<T, void>
) => Promise<StreamResult<void>>;

export type ReadableFilterOp = <T>(
  stream: Readable,
  predicate: StreamPredicate<T> | AsyncStreamPredicate<T>
) => StreamResult<Readable>;

export type ReadableMapOp = <T, R>(
  stream: Readable,
  mapper: StreamProcessor<T, R> | AsyncStreamProcessor<T, R>
) => StreamResult<Readable>;

export type ReadableReduceOp = <T, R>(
  stream: Readable,
  reducer: StreamAccumulator<T, R> | AsyncStreamAccumulator<T, R>,
  initialValue: R
) => Promise<StreamResult<R>>;

// ========================================
// Readable Stream Utilities
// ========================================

export interface ReadableStreamInfo {
  readonly flowing: boolean | null;
  readonly readableEnded: boolean;
  readonly readableLength: number;
  readonly readableHighWaterMark: number;
  readonly readableObjectMode: boolean;
  readonly destroyed: boolean;
}

export interface ReadableMetrics {
  readonly chunksRead: number;
  readonly bytesRead: number;
  readonly readOperations: number;
  readonly averageChunkSize: number;
  readonly readThroughput: number; // bytes per second
}