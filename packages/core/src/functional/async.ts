import { type Result, ResultAsync, err, ok } from 'neverthrow';
import type { TrailheadError } from '../errors/types.js';

/**
 * Convert a Promise to ResultAsync with error handling
 */
export const fromPromise = <T>(
  promise: Promise<T>,
  errorHandler?: (error: unknown) => TrailheadError
): ResultAsync<T, TrailheadError> => {
  return ResultAsync.fromPromise(
    promise,
    errorHandler ||
      (error =>
        ({
          type: 'ASYNC_ERROR',
          message: error instanceof Error ? error.message : 'Unknown async error',
          cause: error,
          recoverable: false,
        }) as TrailheadError)
  );
};

/**
 * Convert a function that throws to a safe ResultAsync
 */
export const fromThrowable = <T, Args extends readonly unknown[]>(
  fn: (...args: Args) => T,
  errorHandler?: (error: unknown) => TrailheadError
): ((...args: Args) => Result<T, TrailheadError>) => {
  return (...args: Args): Result<T, TrailheadError> => {
    try {
      const result = fn(...args);
      return ok(result);
    } catch (error) {
      const trailheadError = errorHandler
        ? errorHandler(error)
        : ({
            type: 'THROWABLE_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
            cause: error,
            recoverable: false,
          } as TrailheadError);
      return err(trailheadError);
    }
  };
};

/**
 * Convert an async function that throws to a safe ResultAsync
 */
export const fromThrowableAsync = <T, Args extends readonly unknown[]>(
  fn: (...args: Args) => Promise<T>,
  errorHandler?: (error: unknown) => TrailheadError
): ((...args: Args) => ResultAsync<T, TrailheadError>) => {
  return (...args: Args): ResultAsync<T, TrailheadError> => {
    return fromPromise(fn(...args), errorHandler);
  };
};

/**
 * Execute multiple async operations in parallel
 */
export const parallel = <T, E>(operations: Array<() => ResultAsync<T, E>>): ResultAsync<T[], E> => {
  const promises = operations.map(op => op());
  return ResultAsync.combine(promises);
};

/**
 * Execute multiple async operations in sequence
 */
export const sequential = <T, E>(
  operations: Array<() => ResultAsync<T, E>>
): ResultAsync<T[], E> => {
  const executeSequentially = async (): Promise<T[]> => {
    const results: T[] = [];
    for (const operation of operations) {
      const result = await operation();
      if (result.isErr()) {
        throw result.error;
      }
      results.push(result.value);
    }
    return results;
  };

  return ResultAsync.fromPromise(executeSequentially(), error => error as E);
};

/**
 * Map over an array with async operations in parallel
 */
export const mapParallel = <T, U, E>(
  items: T[],
  mapper: (item: T) => ResultAsync<U, E>
): ResultAsync<U[], E> => {
  const operations = items.map(item => () => mapper(item));
  return parallel(operations);
};

/**
 * Map over an array with async operations in sequence
 */
export const mapSequential = <T, U, E>(
  items: T[],
  mapper: (item: T) => ResultAsync<U, E>
): ResultAsync<U[], E> => {
  const operations = items.map(item => () => mapper(item));
  return sequential(operations);
};

/**
 * Filter an array with async predicate
 */
export const filterAsync = <T, E>(
  items: T[],
  predicate: (item: T) => ResultAsync<boolean, E>
): ResultAsync<T[], E> => {
  const checkItems = items.map(item =>
    predicate(item).map(shouldInclude => ({ item, shouldInclude }))
  );

  return ResultAsync.combine(checkItems).map(results =>
    results.filter(({ shouldInclude }) => shouldInclude).map(({ item }) => item)
  );
};

/**
 * Reduce an array with async accumulator
 */
export const reduceAsync = <T, U, E>(
  items: T[],
  reducer: (acc: U, item: T) => ResultAsync<U, E>,
  initialValue: U
): ResultAsync<U, E> => {
  const reduceSequentially = async (): Promise<U> => {
    let accumulator = initialValue;
    for (const item of items) {
      const result = await reducer(accumulator, item);
      if (result.isErr()) {
        throw result.error;
      }
      accumulator = result.value;
    }
    return accumulator;
  };

  return ResultAsync.fromPromise(reduceSequentially(), error => error as E);
};

/**
 * Execute an operation with timeout
 */
export const withTimeout = <T, E>(
  operation: () => ResultAsync<T, E>,
  timeoutMs: number,
  timeoutError: E
): ResultAsync<T, E> => {
  const operationWithTimeout = async (): Promise<T> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(timeoutError), timeoutMs);
    });

    const result = await Promise.race([operation(), timeoutPromise]);
    if (result.isErr()) {
      throw result.error;
    }
    return result.value;
  };

  return ResultAsync.fromPromise(operationWithTimeout(), error => error as E);
};

/**
 * Debounce an async operation
 */
export const debounce = <T, E>(
  operation: () => ResultAsync<T, E>,
  delayMs: number
): (() => ResultAsync<T, E>) => {
  let timeoutId: NodeJS.Timeout | null = null;

  return (): ResultAsync<T, E> => {
    const debouncedOperation = async (): Promise<T> => {
      return new Promise((resolve, reject) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(async () => {
          try {
            const result = await operation();
            if (result.isErr()) {
              reject(result.error);
            } else {
              resolve(result.value);
            }
          } catch (error) {
            reject(error);
          }
        }, delayMs);
      });
    };

    return ResultAsync.fromPromise(debouncedOperation(), error => error as E);
  };
};

/**
 * Throttle an async operation
 */
export const throttle = <T, E>(
  operation: () => ResultAsync<T, E>,
  intervalMs: number
): (() => ResultAsync<T, E>) => {
  let lastExecuted = 0;

  return (): ResultAsync<T, E> => {
    const now = Date.now();

    if (now - lastExecuted >= intervalMs) {
      lastExecuted = now;
      return operation();
    }

    // Return a delayed execution
    const delay = intervalMs - (now - lastExecuted);
    const throttledOperation = async (): Promise<T> => {
      return new Promise((resolve, reject) => {
        setTimeout(async () => {
          lastExecuted = Date.now();
          try {
            const result = await operation();
            if (result.isErr()) {
              reject(result.error);
            } else {
              resolve(result.value);
            }
          } catch (error) {
            reject(error);
          }
        }, delay);
      });
    };

    return ResultAsync.fromPromise(throttledOperation(), error => error as E);
  };
};
