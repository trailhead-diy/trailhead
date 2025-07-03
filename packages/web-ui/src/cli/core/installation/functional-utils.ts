/**
 * Functional programming utilities for dependency management
 */

import type { Result } from './types.js';
import { Ok, Err } from './types.js';

// ============================================================================
// FUNCTION COMPOSITION
// ============================================================================

/**
 * Pipe function for composing synchronous functions
 */
export const pipe =
  <T>(...fns: Array<(arg: T) => T>) =>
  (value: T): T =>
    fns.reduce((acc, fn) => fn(acc), value);

/**
 * Pipe function for composing asynchronous functions
 */
export const pipeAsync =
  <T>(...fns: Array<(arg: T) => Promise<T>>) =>
  async (value: T): Promise<T> => {
    let result = value;
    for (const fn of fns) {
      result = await fn(result);
    }
    return result;
  };

/**
 * Compose function (right to left)
 */
export const compose =
  <T>(...fns: Array<(arg: T) => T>) =>
  (value: T): T =>
    fns.reduceRight((acc, fn) => fn(acc), value);

// ============================================================================
// RESULT TYPE HELPERS
// ============================================================================

/**
 * Map over a Result's success value
 */
export const mapResult = <T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> =>
  result.success ? Ok(fn(result.value)) : result;

/**
 * FlatMap over a Result's success value
 */
export const flatMapResult = <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> => (result.success ? fn(result.value) : result);

/**
 * Map over a Result's error value
 */
export const mapError = <T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> =>
  result.success ? result : Err(fn(result.error));

/**
 * Combine multiple Results into one
 */
export const combineResults = <T, E>(results: readonly Result<T, E>[]): Result<readonly T[], E> => {
  const values: T[] = [];

  for (const result of results) {
    if (!result.success) {
      return result;
    }
    values.push(result.value);
  }

  return Ok(Object.freeze(values));
};

/**
 * Try a function and return a Result
 */
export const tryCatch = <T, E = Error>(
  fn: () => T,
  mapError?: (error: unknown) => E
): Result<T, E> => {
  try {
    return Ok(fn());
  } catch (error) {
    const mappedError = mapError ? mapError(error) : (error as E);
    return Err(mappedError);
  }
};

/**
 * Try an async function and return a Result
 */
export const tryCatchAsync = async <T, E = Error>(
  fn: () => Promise<T>,
  mapError?: (error: unknown) => E
): Promise<Result<T, E>> => {
  try {
    const value = await fn();
    return Ok(value);
  } catch (error) {
    const mappedError = mapError ? mapError(error) : (error as E);
    return Err(mappedError);
  }
};

// ============================================================================
// IMMUTABLE DATA HELPERS
// ============================================================================

/**
 * Update a record immutably
 */
export const updateRecord = <T>(
  record: Readonly<Record<string, T>>,
  updates: Readonly<Record<string, T>>
): Readonly<Record<string, T>> => ({
  ...record,
  ...updates,
});

/**
 * Update an array immutably
 */
export const updateArray = <T>(
  array: readonly T[],
  index: number,
  updater: (item: T) => T
): readonly T[] => {
  if (index < 0 || index >= array.length) {
    return array;
  }

  return array.map((item, i) => (i === index ? updater(item) : item));
};

/**
 * Append to an array immutably
 */
export const appendToArray = <T>(array: readonly T[], ...items: readonly T[]): readonly T[] => [
  ...array,
  ...items,
];

/**
 * Remove from array immutably
 */
export const removeFromArray = <T>(
  array: readonly T[],
  predicate: (item: T) => boolean
): readonly T[] => array.filter(item => !predicate(item));

// ============================================================================
// FUNCTIONAL HELPERS
// ============================================================================

/**
 * Identity function
 */
export const identity = <T>(x: T): T => x;

/**
 * Constant function
 */
export const constant =
  <T>(x: T) =>
  (): T =>
    x;

/**
 * Partial application
 */
export const partial =
  <T extends any[], U extends any[], R>(fn: (...args: [...T, ...U]) => R, ...initialArgs: T) =>
  (...remainingArgs: U): R =>
    fn(...initialArgs, ...remainingArgs);

/**
 * Curry a binary function
 */
export const curry2 =
  <A, B, R>(fn: (a: A, b: B) => R) =>
  (a: A) =>
  (b: B): R =>
    fn(a, b);

/**
 * Memoize a function
 */
export const memoize = <T extends (...args: any[]) => any>(
  fn: T,
  keyFn?: (...args: Parameters<T>) => string
): T => {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

// ============================================================================
// ASYNC HELPERS
// ============================================================================

/**
 * Run async functions in parallel
 */
export const parallel = async <T>(fns: readonly (() => Promise<T>)[]): Promise<readonly T[]> => {
  const results = await Promise.all(fns.map(fn => fn()));
  return Object.freeze(results);
};

/**
 * Run async functions in sequence
 */
export const sequence = async <T>(fns: readonly (() => Promise<T>)[]): Promise<readonly T[]> => {
  const results: T[] = [];

  for (const fn of fns) {
    results.push(await fn());
  }

  return Object.freeze(results);
};

/**
 * Debounce a function
 */
export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>): void => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
};

// ============================================================================
// PREDICATE HELPERS
// ============================================================================

/**
 * Negate a predicate
 */
export const not =
  <T>(predicate: (value: T) => boolean) =>
  (value: T): boolean =>
    !predicate(value);

/**
 * Combine predicates with AND
 */
export const and =
  <T>(...predicates: Array<(value: T) => boolean>) =>
  (value: T): boolean =>
    predicates.every(p => p(value));

/**
 * Combine predicates with OR
 */
export const or =
  <T>(...predicates: Array<(value: T) => boolean>) =>
  (value: T): boolean =>
    predicates.some(p => p(value));
