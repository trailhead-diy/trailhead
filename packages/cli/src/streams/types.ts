/**
 * Streaming support for large file processing with memory efficiency
 */

// Stream types from node:stream are imported as needed in implementation files
import type { Result } from '../core/index.js';

export interface StreamOptions {
  readonly encoding?: BufferEncoding;
  readonly highWaterMark?: number;
  readonly objectMode?: boolean;
}

export interface ReadStreamOptions extends StreamOptions {
  readonly start?: number;
  readonly end?: number;
  readonly autoClose?: boolean;
}

export interface WriteStreamOptions extends StreamOptions {
  readonly flags?: string;
  readonly mode?: number;
  readonly autoClose?: boolean;
}

export interface TransformStreamOptions extends StreamOptions {
  readonly allowHalfOpen?: boolean;
}

export type StreamTransformer<TInput = any, TOutput = any> = (
  chunk: TInput
) => Promise<TOutput> | TOutput;

export type StreamFilter<T = any> = (chunk: T) => Promise<boolean> | boolean;

export type StreamMapper<TInput = any, TOutput = any> = (
  chunk: TInput,
  index: number
) => Promise<TOutput> | TOutput;

export interface StreamPipelineOptions {
  readonly signal?: AbortSignal;
  readonly end?: boolean;
}

export interface StreamProcessingResult {
  readonly processed: number;
  readonly errors: number;
  readonly duration: number;
  readonly throughput: number;
}

export interface BatchProcessingOptions {
  readonly batchSize: number;
  readonly maxConcurrency?: number;
  readonly onBatch?: (batch: any[], batchIndex: number) => Promise<void> | void;
  readonly onError?: (error: Error, chunk: any) => Promise<void> | void;
}

export type StreamFactory<T extends NodeJS.ReadWriteStream = NodeJS.ReadWriteStream> = (
  options?: StreamOptions
) => Result<T>;

export interface StreamStats {
  readonly bytesRead: number;
  readonly bytesWritten: number;
  readonly chunksProcessed: number;
  readonly errors: number;
  readonly startTime: number;
  readonly endTime?: number;
}
