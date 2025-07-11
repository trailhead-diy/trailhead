import { ok, err } from '@trailhead/core';
import { Transform } from 'node:stream';
import { createGzip, createGunzip } from 'node:zlib';
import type {
  TransformConfig,
  TransformOperations,
  StreamResult,
  StreamProcessor,
  AsyncStreamProcessor,
  StreamPredicate,
  AsyncStreamPredicate,
  BatchConfig,
} from '../types.js';
import type { CreateTransformOperations, BatchState, ThrottleState, DebounceState } from './types.js';
import { defaultTransformConfig } from './types.js';
import {
  createStreamError,
  mapStreamError,
} from '../errors.js';

// ========================================
// Transform Stream Operations
// ========================================

export const createTransformOperations: CreateTransformOperations = (config = {}) => {
  const transformConfig = { ...defaultTransformConfig, ...config };

  const map = <T, R>(
    mapper: StreamProcessor<T, R> | AsyncStreamProcessor<T, R>,
    options: TransformConfig = {}
  ): StreamResult<Transform> => {
    try {
      const mergedOptions = { ...transformConfig, ...options };

      const stream = new Transform({
        objectMode: mergedOptions.objectMode,
        highWaterMark: mergedOptions.highWaterMark,
        async transform(chunk: T, encoding, callback) {
          try {
            const result = mapper(chunk);
            const mappedValue = result instanceof Promise ? await result : result;
            
            if (mappedValue.isErr()) {
              callback(new Error(mappedValue.error.message));
              return;
            }
            
            callback(null, mappedValue.value);
          } catch (error) {
            callback(error instanceof Error ? error : new Error(String(error)));
          }
        },
      });

      return ok(stream);
    } catch (error) {
      return err(mapStreamError('map', 'transform', error));
    }
  };

  const filter = <T>(
    predicate: StreamPredicate<T> | AsyncStreamPredicate<T>,
    options: TransformConfig = {}
  ): StreamResult<Transform> => {
    try {
      const mergedOptions = { ...transformConfig, ...options };

      const stream = new Transform({
        objectMode: mergedOptions.objectMode,
        highWaterMark: mergedOptions.highWaterMark,
        async transform(chunk: T, encoding, callback) {
          try {
            const shouldInclude = await predicate(chunk);
            if (shouldInclude) {
              callback(null, chunk);
            } else {
              callback(); // Skip this chunk
            }
          } catch (error) {
            callback(error instanceof Error ? error : new Error(String(error)));
          }
        },
      });

      return ok(stream);
    } catch (error) {
      return err(mapStreamError('filter', 'transform', error));
    }
  };

  const batch = <T>(
    batchConfig: BatchConfig,
    options: TransformConfig = {}
  ): StreamResult<Transform> => {
    try {
      const mergedOptions = { ...transformConfig, ...options };
      let state: BatchState<T> = {
        items: [],
        size: 0,
        lastFlush: Date.now(),
      };

      const flushBatch = (callback: (error?: Error | null, data?: any) => void) => {
        if (state.items.length > 0) {
          const batch = [...state.items];
          state = {
            items: [],
            size: 0,
            lastFlush: Date.now(),
          };
          callback(null, batch);
        } else {
          callback();
        }
      };

      const stream = new Transform({
        objectMode: true, // Batches are always objects
        highWaterMark: mergedOptions.highWaterMark,
        transform(chunk: T, encoding, callback) {
          state.items.push(chunk);
          state.size++;

          // Flush if batch size reached
          if (state.size >= batchConfig.batchSize) {
            flushBatch(callback);
          } else {
            // Set timeout for flush if configured
            if (batchConfig.flushTimeout && !state.timeoutId) {
              state = {
                ...state,
                timeoutId: setTimeout(() => {
                  flushBatch((error, data) => {
                    if (data) {
                      this.push(data);
                    }
                  });
                }, batchConfig.flushTimeout),
              };
            }
            callback();
          }
        },
        flush(callback) {
          if (state.timeoutId) {
            clearTimeout(state.timeoutId);
          }
          flushBatch(callback);
        },
      });

      return ok(stream);
    } catch (error) {
      return err(mapStreamError('batch', 'transform', error));
    }
  };

  const debounce = <T>(
    delayMs: number,
    options: TransformConfig = {}
  ): StreamResult<Transform> => {
    try {
      const mergedOptions = { ...transformConfig, ...options };
      let state: DebounceState<T> = {};

      const stream = new Transform({
        objectMode: mergedOptions.objectMode,
        highWaterMark: mergedOptions.highWaterMark,
        transform(chunk: T, encoding, callback) {
          // Clear existing timeout
          if (state.timeoutId) {
            clearTimeout(state.timeoutId);
          }

          // Update state with new pending value
          state = {
            pending: chunk,
            timeoutId: setTimeout(() => {
              if (state.pending !== undefined) {
                this.push(state.pending);
                state = {};
              }
            }, delayMs),
          };

          callback();
        },
        flush(callback) {
          if (state.timeoutId) {
            clearTimeout(state.timeoutId);
          }
          if (state.pending !== undefined) {
            callback(null, state.pending);
          } else {
            callback();
          }
        },
      });

      return ok(stream);
    } catch (error) {
      return err(mapStreamError('debounce', 'transform', error));
    }
  };

  const throttle = <T>(
    intervalMs: number,
    options: TransformConfig = {}
  ): StreamResult<Transform> => {
    try {
      const mergedOptions = { ...transformConfig, ...options };
      let state: ThrottleState<T> = {
        lastEmit: 0,
      };

      const stream = new Transform({
        objectMode: mergedOptions.objectMode,
        highWaterMark: mergedOptions.highWaterMark,
        transform(chunk: T, encoding, callback) {
          const now = Date.now();
          const timeSinceLastEmit = now - state.lastEmit;

          if (timeSinceLastEmit >= intervalMs) {
            // Can emit immediately
            state.lastEmit = now;
            callback(null, chunk);
          } else {
            // Clear existing timeout and set new one
            if (state.timeoutId) {
              clearTimeout(state.timeoutId);
            }

            const remainingDelay = intervalMs - timeSinceLastEmit;
            state = {
              lastEmit: state.lastEmit,
              pending: chunk,
              timeoutId: setTimeout(() => {
                if (state.pending !== undefined) {
                  state.lastEmit = Date.now();
                  this.push(state.pending);
                  state = { lastEmit: state.lastEmit };
                }
              }, remainingDelay),
            };

            callback();
          }
        },
        flush(callback) {
          if (state.timeoutId) {
            clearTimeout(state.timeoutId);
          }
          if (state.pending !== undefined) {
            callback(null, state.pending);
          } else {
            callback();
          }
        },
      });

      return ok(stream);
    } catch (error) {
      return err(mapStreamError('throttle', 'transform', error));
    }
  };

  const compress = (options: TransformConfig = {}): StreamResult<Transform> => {
    try {
      const gzip = createGzip();
      return ok(gzip);
    } catch (error) {
      return err(mapStreamError('compress', 'transform', error));
    }
  };

  const decompress = (options: TransformConfig = {}): StreamResult<Transform> => {
    try {
      const gunzip = createGunzip();
      return ok(gunzip);
    } catch (error) {
      return err(mapStreamError('decompress', 'transform', error));
    }
  };

  return {
    map,
    filter,
    batch,
    debounce,
    throttle,
    compress,
    decompress,
  };
};