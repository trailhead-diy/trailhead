import { ok, err } from '@trailhead/core';
import { Readable } from 'node:stream';
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
import type { CreateReadableOperations } from './types.js';
import { defaultReadableConfig } from './types.js';
import {
  createStreamError,
  createStreamTimeoutError,
  createInvalidStreamError,
  mapStreamError,
} from '../errors.js';

// ========================================
// Readable Stream Operations
// ========================================

export const createReadableOperations: CreateReadableOperations = (config = {}) => {
  const readableConfig = { ...defaultReadableConfig, ...config };

  const createFromArray = <T>(data: T[], options: ReadableConfig = {}): StreamResult<Readable> => {
    try {
      const mergedOptions = { ...readableConfig, ...options };
      let index = 0;

      const stream = new Readable({
        objectMode: mergedOptions.objectMode,
        highWaterMark: mergedOptions.highWaterMark,
        read() {
          if (index < data.length) {
            this.push(data[index++]);
          } else {
            this.push(null); // End the stream
          }
        },
      });

      return ok(stream);
    } catch (error) {
      return err(mapStreamError('createFromArray', 'readable', error));
    }
  };

  const createFromIterator = <T>(iterator: Iterable<T>, options: ReadableConfig = {}): StreamResult<Readable> => {
    try {
      const mergedOptions = { ...readableConfig, ...options };
      const iter = iterator[Symbol.iterator]();

      const stream = new Readable({
        objectMode: mergedOptions.objectMode,
        highWaterMark: mergedOptions.highWaterMark,
        read() {
          const result = iter.next();
          if (result.done) {
            this.push(null);
          } else {
            this.push(result.value);
          }
        },
      });

      return ok(stream);
    } catch (error) {
      return err(mapStreamError('createFromIterator', 'readable', error));
    }
  };

  const createFromAsyncIterator = <T>(iterator: AsyncIterable<T>, options: ReadableConfig = {}): StreamResult<Readable> => {
    try {
      const mergedOptions = { ...readableConfig, ...options };
      const iter = iterator[Symbol.asyncIterator]();

      const stream = new Readable({
        objectMode: mergedOptions.objectMode,
        highWaterMark: mergedOptions.highWaterMark,
        async read() {
          try {
            const result = await iter.next();
            if (result.done) {
              this.push(null);
            } else {
              this.push(result.value);
            }
          } catch (error) {
            this.destroy(error instanceof Error ? error : new Error(String(error)));
          }
        },
      });

      return ok(stream);
    } catch (error) {
      return err(mapStreamError('createFromAsyncIterator', 'readable', error));
    }
  };

  const toArray = <T>(stream: Readable): Promise<StreamResult<T[]>> => {
    return new Promise((resolve) => {
      const chunks: T[] = [];
      let hasError = false;

      const cleanup = () => {
        stream.removeAllListeners('data');
        stream.removeAllListeners('end');
        stream.removeAllListeners('error');
      };

      const timeoutId = setTimeout(() => {
        if (!hasError) {
          hasError = true;
          cleanup();
          resolve(err(createStreamTimeoutError(readableConfig.timeout, 'toArray')));
        }
      }, readableConfig.timeout);

      stream.on('data', (chunk: T) => {
        if (!hasError) {
          chunks.push(chunk);
        }
      });

      stream.on('end', () => {
        if (!hasError) {
          clearTimeout(timeoutId);
          cleanup();
          resolve(ok(chunks));
        }
      });

      stream.on('error', (error) => {
        if (!hasError) {
          hasError = true;
          clearTimeout(timeoutId);
          cleanup();
          resolve(err(mapStreamError('toArray', 'readable', error)));
        }
      });
    });
  };

  const forEach = <T>(
    stream: Readable,
    fn: StreamProcessor<T, void> | AsyncStreamProcessor<T, void>
  ): Promise<StreamResult<void>> => {
    return new Promise((resolve) => {
      let hasError = false;

      const cleanup = () => {
        stream.removeAllListeners('data');
        stream.removeAllListeners('end');
        stream.removeAllListeners('error');
      };

      const timeoutId = setTimeout(() => {
        if (!hasError) {
          hasError = true;
          cleanup();
          resolve(err(createStreamTimeoutError(readableConfig.timeout, 'forEach')));
        }
      }, readableConfig.timeout);

      stream.on('data', async (chunk: T) => {
        if (hasError) return;

        try {
          const result = fn(chunk);
          if (result instanceof Promise) {
            const awaitedResult = await result;
            if (awaitedResult.isErr()) {
              hasError = true;
              clearTimeout(timeoutId);
              cleanup();
              resolve(err(awaitedResult.error));
              return;
            }
          } else if (result.isErr()) {
            hasError = true;
            clearTimeout(timeoutId);
            cleanup();
            resolve(err(result.error));
            return;
          }
        } catch (error) {
          hasError = true;
          clearTimeout(timeoutId);
          cleanup();
          resolve(err(mapStreamError('forEach', 'readable', error)));
        }
      });

      stream.on('end', () => {
        if (!hasError) {
          clearTimeout(timeoutId);
          cleanup();
          resolve(ok(undefined));
        }
      });

      stream.on('error', (error) => {
        if (!hasError) {
          hasError = true;
          clearTimeout(timeoutId);
          cleanup();
          resolve(err(mapStreamError('forEach', 'readable', error)));
        }
      });
    });
  };

  const filter = <T>(
    stream: Readable,
    predicate: StreamPredicate<T> | AsyncStreamPredicate<T>
  ): StreamResult<Readable> => {
    try {
      const filteredStream = new Readable({
        objectMode: true,
        read() {
          // The filtering is handled in the data event
        },
      });

      stream.on('data', async (chunk: T) => {
        try {
          const shouldInclude = await predicate(chunk);
          if (shouldInclude) {
            filteredStream.push(chunk);
          }
        } catch (error) {
          filteredStream.destroy(error instanceof Error ? error : new Error(String(error)));
        }
      });

      stream.on('end', () => {
        filteredStream.push(null);
      });

      stream.on('error', (error) => {
        filteredStream.destroy(error);
      });

      return ok(filteredStream);
    } catch (error) {
      return err(mapStreamError('filter', 'readable', error));
    }
  };

  const map = <T, R>(
    stream: Readable,
    mapper: StreamProcessor<T, R> | AsyncStreamProcessor<T, R>
  ): StreamResult<Readable> => {
    try {
      const mappedStream = new Readable({
        objectMode: true,
        read() {
          // The mapping is handled in the data event
        },
      });

      stream.on('data', async (chunk: T) => {
        try {
          const result = mapper(chunk);
          const mappedValue = result instanceof Promise ? await result : result;
          
          if (mappedValue.isErr()) {
            mappedStream.destroy(new Error(mappedValue.error.message));
            return;
          }
          
          mappedStream.push(mappedValue.value);
        } catch (error) {
          mappedStream.destroy(error instanceof Error ? error : new Error(String(error)));
        }
      });

      stream.on('end', () => {
        mappedStream.push(null);
      });

      stream.on('error', (error) => {
        mappedStream.destroy(error);
      });

      return ok(mappedStream);
    } catch (error) {
      return err(mapStreamError('map', 'readable', error));
    }
  };

  const reduce = <T, R>(
    stream: Readable,
    reducer: StreamAccumulator<T, R> | AsyncStreamAccumulator<T, R>,
    initialValue: R
  ): Promise<StreamResult<R>> => {
    return new Promise((resolve) => {
      let accumulator = initialValue;
      let hasError = false;

      const cleanup = () => {
        stream.removeAllListeners('data');
        stream.removeAllListeners('end');
        stream.removeAllListeners('error');
      };

      const timeoutId = setTimeout(() => {
        if (!hasError) {
          hasError = true;
          cleanup();
          resolve(err(createStreamTimeoutError(readableConfig.timeout, 'reduce')));
        }
      }, readableConfig.timeout);

      stream.on('data', async (chunk: T) => {
        if (hasError) return;

        try {
          accumulator = await reducer(accumulator, chunk);
        } catch (error) {
          hasError = true;
          clearTimeout(timeoutId);
          cleanup();
          resolve(err(mapStreamError('reduce', 'readable', error)));
        }
      });

      stream.on('end', () => {
        if (!hasError) {
          clearTimeout(timeoutId);
          cleanup();
          resolve(ok(accumulator));
        }
      });

      stream.on('error', (error) => {
        if (!hasError) {
          hasError = true;
          clearTimeout(timeoutId);
          cleanup();
          resolve(err(mapStreamError('reduce', 'readable', error)));
        }
      });
    });
  };

  return {
    createFromArray,
    createFromIterator,
    createFromAsyncIterator,
    toArray,
    forEach,
    filter,
    map,
    reduce,
  };
};