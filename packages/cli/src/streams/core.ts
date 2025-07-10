/**
 * Core streaming utilities and factory functions
 */

import {
  createReadStream as nodeCreateReadStream,
  createWriteStream as nodeCreateWriteStream,
} from 'node:fs';
import { Transform, pipeline as nodePipeline } from 'node:stream';
import { promisify } from 'node:util';
import type { Result, CLIError } from '../core/errors/types.js';
import { ok, err } from '../core/errors/utils.js';
import { createError } from '../core/errors/factory.js';
import type {
  ReadStreamOptions,
  WriteStreamOptions,
  TransformStreamOptions,
  StreamTransformer,
  StreamFilter,
  StreamMapper,
  StreamStats,
  BatchProcessingOptions,
} from './types.js';

const pipelineAsync = promisify(nodePipeline);

/**
 * Create a read stream for a file
 */
export function createReadStream(
  filePath: string,
  options: ReadStreamOptions = {}
): Result<NodeJS.ReadableStream, CLIError> {
  try {
    const stream = nodeCreateReadStream(filePath, {
      encoding: options.encoding,
      highWaterMark: options.highWaterMark,
      start: options.start,
      end: options.end,
      autoClose: options.autoClose ?? true,
    });

    return ok(stream);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create read stream';
    return err(
      createError('STREAM_READ_FAILED', `Failed to create read stream for ${filePath}`, {
        details: message,
        recoverable: false,
      })
    );
  }
}

/**
 * Create a write stream for a file
 */
export function createWriteStream(
  filePath: string,
  options: WriteStreamOptions = {}
): Result<NodeJS.WritableStream, CLIError> {
  try {
    const stream = nodeCreateWriteStream(filePath, {
      encoding: options.encoding,
      highWaterMark: options.highWaterMark,
      flags: options.flags ?? 'w',
      mode: options.mode,
      autoClose: options.autoClose ?? true,
    });

    return ok(stream);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create write stream';
    return err(
      createError('STREAM_WRITE_FAILED', `Failed to create write stream for ${filePath}`, {
        details: message,
        recoverable: false,
      })
    );
  }
}

/**
 * Create a transform stream with a custom transformer function
 */
export function createTransformStream<TInput = any, TOutput = any>(
  transformer: StreamTransformer<TInput, TOutput>,
  options: TransformStreamOptions = {}
): Result<Transform, CLIError> {
  try {
    const transform = new Transform({
      objectMode: options.objectMode ?? true,
      highWaterMark: options.highWaterMark,
      allowHalfOpen: options.allowHalfOpen,

      async transform(chunk: TInput, _encoding, callback) {
        try {
          const result = await transformer(chunk);
          callback(null, result);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Transform error';
          callback(new Error(`Transform failed: ${errorMessage}`));
        }
      },
    });

    return ok(transform);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create transform stream';
    return err(
      createError('STREAM_TRANSFORM_FAILED', 'Failed to create transform stream', {
        details: message,
        recoverable: false,
      })
    );
  }
}

/**
 * Create a filter stream that only passes chunks matching the predicate
 */
export function createFilterStream<T = any>(
  predicate: StreamFilter<T>,
  options: TransformStreamOptions = {}
): Result<Transform, CLIError> {
  return createTransformStream(
    async (chunk: T) => {
      const shouldPass = await predicate(chunk);
      return shouldPass ? chunk : null;
    },
    {
      ...options,
      objectMode: options.objectMode ?? true,
    }
  );
}

/**
 * Create a map stream that transforms each chunk
 */
export function createMapStream<TInput = any, TOutput = any>(
  mapper: StreamMapper<TInput, TOutput>,
  options: TransformStreamOptions = {}
): Result<Transform, CLIError> {
  let index = 0;

  return createTransformStream(
    async (chunk: TInput) => {
      const result = await mapper(chunk, index++);
      return result;
    },
    {
      ...options,
      objectMode: options.objectMode ?? true,
    }
  );
}

/**
 * Create a batch processing stream
 */
export function createBatchStream<T = any>(
  batchOptions: BatchProcessingOptions,
  options: TransformStreamOptions = {}
): Result<Transform, CLIError> {
  try {
    let batch: T[] = [];
    let batchIndex = 0;

    const transform = new Transform({
      objectMode: options.objectMode ?? true,
      highWaterMark: options.highWaterMark,

      async transform(chunk: T, _encoding, callback) {
        try {
          batch.push(chunk);

          if (batch.length >= batchOptions.batchSize) {
            const currentBatch = batch;
            batch = [];

            if (batchOptions.onBatch) {
              await batchOptions.onBatch(currentBatch, batchIndex++);
            }

            // Emit the batch
            callback(null, currentBatch);
          } else {
            callback();
          }
        } catch (error) {
          if (batchOptions.onError) {
            await batchOptions.onError(error as Error, chunk);
          }
          callback(error as Error);
        }
      },

      async flush(callback) {
        try {
          // Emit remaining batch if any
          if (batch.length > 0 && batchOptions.onBatch) {
            await batchOptions.onBatch(batch, batchIndex);
            callback(null, batch);
          } else {
            callback();
          }
        } catch (error) {
          callback(error as Error);
        }
      },
    });

    return ok(transform);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create batch stream';
    return err(
      createError('STREAM_BATCH_FAILED', 'Failed to create batch stream', {
        details: message,
        recoverable: false,
      })
    );
  }
}

/**
 * Create a stream that collects statistics
 */
export function createStatsStream(
  onStats?: (stats: StreamStats) => void,
  options: TransformStreamOptions = {}
): Result<Transform, CLIError> {
  try {
    const stats = {
      bytesRead: 0,
      bytesWritten: 0,
      chunksProcessed: 0,
      errors: 0,
      startTime: Date.now(),
    };

    const transform = new Transform({
      objectMode: options.objectMode ?? false,
      highWaterMark: options.highWaterMark,

      transform(chunk, _encoding, callback) {
        stats.bytesRead += Buffer.isBuffer(chunk)
          ? chunk.length
          : Buffer.byteLength(chunk.toString());
        stats.chunksProcessed++;

        if (onStats) {
          onStats({ ...stats });
        }

        callback(null, chunk);
      },

      flush(callback) {
        const finalStats = {
          ...stats,
          endTime: Date.now(),
        };

        if (onStats) {
          onStats(finalStats);
        }

        callback();
      },
    });

    return ok(transform);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create stats stream';
    return err(
      createError('STREAM_STATS_FAILED', 'Failed to create stats stream', {
        details: message,
        recoverable: false,
      })
    );
  }
}

/**
 * Pipeline multiple streams together with error handling
 */
export async function pipeline(
  stream1: NodeJS.ReadableStream,
  stream2: NodeJS.WritableStream | NodeJS.ReadWriteStream,
  ...additionalStreams: (NodeJS.WritableStream | NodeJS.ReadWriteStream)[]
): Promise<Result<void, CLIError>> {
  try {
    await pipelineAsync(stream1, stream2, ...additionalStreams);
    return ok(undefined);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Pipeline error';
    return err(
      createError('STREAM_PIPELINE_FAILED', 'Stream pipeline failed', {
        details: message,
        recoverable: false,
      })
    );
  }
}

/**
 * Read entire stream into memory (use carefully with large streams)
 */
export async function streamToBuffer(
  stream: NodeJS.ReadableStream
): Promise<Result<Buffer, CLIError>> {
  try {
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    return ok(Buffer.concat(chunks));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to read stream';
    return err(
      createError('STREAM_READ_BUFFER_FAILED', 'Failed to read stream to buffer', {
        details: message,
        recoverable: false,
      })
    );
  }
}

/**
 * Read stream as string
 */
export async function streamToString(
  stream: NodeJS.ReadableStream,
  encoding: BufferEncoding = 'utf8'
): Promise<Result<string, CLIError>> {
  const bufferResult = await streamToBuffer(stream);

  if (bufferResult.isErr()) {
    return err(bufferResult.error);
  }

  try {
    return ok(bufferResult.value.toString(encoding));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to convert buffer to string';
    return err(
      createError('STREAM_STRING_CONVERSION_FAILED', 'Failed to convert stream to string', {
        details: message,
        recoverable: false,
      })
    );
  }
}
