import { ok, err } from '@trailhead/core';
import { Writable } from 'node:stream';
import type { WritableConfig, StreamResult } from '../types.js';
import type { CreateWritableOperations } from './types.js';
import { defaultWritableConfig } from './types.js';
import { createStreamTimeoutError, createStreamClosedError, mapStreamError } from '../errors.js';

// ========================================
// Writable Stream Operations
// ========================================

export const createWritableOperations: CreateWritableOperations = (config = {}) => {
  const writableConfig = { ...defaultWritableConfig, ...config };

  const createToArray = <T>(target: T[], options: WritableConfig = {}): StreamResult<Writable> => {
    try {
      const mergedOptions = { ...writableConfig, ...options };

      const stream = new Writable({
        objectMode: mergedOptions.objectMode,
        highWaterMark: mergedOptions.highWaterMark,
        write(chunk: T, encoding, callback) {
          try {
            target.push(chunk);
            callback();
          } catch (error) {
            callback(error instanceof Error ? error : new Error(String(error)));
          }
        },
      });

      return ok(stream);
    } catch (error) {
      return err(mapStreamError('createToArray', 'writable', error));
    }
  };

  const createToCallback = <T>(
    callback: (data: T) => void | Promise<void>,
    options: WritableConfig = {}
  ): StreamResult<Writable> => {
    try {
      const mergedOptions = { ...writableConfig, ...options };

      const stream = new Writable({
        objectMode: mergedOptions.objectMode,
        highWaterMark: mergedOptions.highWaterMark,
        async write(chunk: T, encoding, streamCallback) {
          try {
            const result = callback(chunk);
            if (result instanceof Promise) {
              await result;
            }
            streamCallback();
          } catch (error) {
            streamCallback(error instanceof Error ? error : new Error(String(error)));
          }
        },
      });

      return ok(stream);
    } catch (error) {
      return err(mapStreamError('createToCallback', 'writable', error));
    }
  };

  const writeAll = <T>(stream: Writable, data: T[]): Promise<StreamResult<void>> => {
    return new Promise(resolve => {
      if (!stream.writable) {
        resolve(err(createStreamClosedError('writable stream')));
        return;
      }

      let hasError = false;
      let index = 0;

      const cleanup = () => {
        stream.removeAllListeners('error');
        stream.removeAllListeners('finish');
        stream.removeAllListeners('close');
      };

      const timeoutId = setTimeout(() => {
        if (!hasError) {
          hasError = true;
          cleanup();
          resolve(err(createStreamTimeoutError(writableConfig.timeout, 'writeAll')));
        }
      }, writableConfig.timeout);

      const writeNext = () => {
        if (hasError) return;

        if (index >= data.length) {
          // All data written, end the stream
          stream.end();
          return;
        }

        const chunk = data[index++];
        const canContinue = stream.write(chunk);

        if (canContinue) {
          // Can write more immediately
          setImmediate(writeNext);
        } else {
          // Wait for drain event
          stream.once('drain', writeNext);
        }
      };

      stream.on('error', error => {
        if (!hasError) {
          hasError = true;
          clearTimeout(timeoutId);
          cleanup();
          resolve(err(mapStreamError('writeAll', 'writable', error)));
        }
      });

      stream.on('finish', () => {
        if (!hasError) {
          clearTimeout(timeoutId);
          cleanup();
          resolve(ok(undefined));
        }
      });

      stream.on('close', () => {
        if (!hasError) {
          clearTimeout(timeoutId);
          cleanup();
          resolve(ok(undefined));
        }
      });

      // Start writing
      writeNext();
    });
  };

  const end = (stream: Writable): Promise<StreamResult<void>> => {
    return new Promise(resolve => {
      if (!stream.writable) {
        resolve(err(createStreamClosedError('writable stream')));
        return;
      }

      let hasError = false;

      const cleanup = () => {
        stream.removeAllListeners('error');
        stream.removeAllListeners('finish');
        stream.removeAllListeners('close');
      };

      const timeoutId = setTimeout(() => {
        if (!hasError) {
          hasError = true;
          cleanup();
          resolve(err(createStreamTimeoutError(writableConfig.timeout, 'end')));
        }
      }, writableConfig.timeout);

      stream.on('error', error => {
        if (!hasError) {
          hasError = true;
          clearTimeout(timeoutId);
          cleanup();
          resolve(err(mapStreamError('end', 'writable', error)));
        }
      });

      stream.on('finish', () => {
        if (!hasError) {
          clearTimeout(timeoutId);
          cleanup();
          resolve(ok(undefined));
        }
      });

      stream.on('close', () => {
        if (!hasError) {
          clearTimeout(timeoutId);
          cleanup();
          resolve(ok(undefined));
        }
      });

      stream.end();
    });
  };

  return {
    createToArray,
    createToCallback,
    writeAll,
    end,
  };
};
