/**
 * Shared utilities for installation modules
 */

import type { Result, InstallError } from './types.js';
import { Ok, Err } from './types.js';
import { createError } from '@esteban-url/trailhead-cli/core';

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Create a simple error object
 */
export const createSimpleError = (
  type: 'DependencyError' | 'ValidationError',
  baseMessage: string,
  error: unknown
): InstallError =>
  createError(
    type === 'DependencyError' ? 'DEPENDENCY_ERROR' : 'VALIDATION_ERROR',
    `${baseMessage}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    { cause: error instanceof Error ? error : undefined }
  );

/**
 * Generic async error handler with type-safe error creation
 */
export const handleAsync = <T>(
  fn: () => Promise<T>,
  errorType: 'DependencyError' | 'ValidationError',
  errorMessage: string
): Promise<Result<T, InstallError>> =>
  fn()
    .then(value => Ok(value))
    .catch(error => Err(createSimpleError(errorType, errorMessage, error)));

/**
 * Wrap async function with consistent error handling
 */
export const wrapAsync =
  <TArgs extends readonly unknown[], TResult>(
    fn: (...args: TArgs) => Promise<TResult>,
    errorType: 'DependencyError' | 'ValidationError',
    errorMessage: string
  ) =>
  async (...args: TArgs): Promise<Result<TResult, InstallError>> =>
    handleAsync(() => fn(...args), errorType, errorMessage);

// ============================================================================
// FILE PATTERN UTILITIES
// ============================================================================

/**
 * Count files matching a pattern
 */
export const countFilesByPattern = (files: readonly string[], pattern: string): number =>
  files.filter(file => file.includes(pattern)).length;

/**
 * Group files by pattern
 */
export const groupFilesByPattern = (
  files: readonly string[],
  patterns: readonly { name: string; pattern: string | RegExp }[]
): Record<string, readonly string[]> => {
  const groups: Record<string, string[]> = {};

  patterns.forEach(({ name }) => {
    groups[name] = [];
  });

  files.forEach(file => {
    patterns.forEach(({ name, pattern }) => {
      const matches = typeof pattern === 'string' ? file.includes(pattern) : pattern.test(file);

      if (matches) {
        groups[name].push(file);
      }
    });
  });

  return Object.fromEntries(
    Object.entries(groups).map(([key, value]) => [key, Object.freeze(value)])
  );
};

// ============================================================================
// STATE UPDATE UTILITIES
// ============================================================================

/**
 * Generic immutable state updater
 */
export const updateState = <T extends object>(state: T, updates: Partial<T>): T =>
  Object.freeze({ ...state, ...updates });

/**
 * Update nested state immutably
 */
export const updateNestedState = <T extends object, K extends keyof T>(
  state: T,
  key: K,
  updates: Partial<T[K]>
): T =>
  updateState(state, {
    [key]: updateState(state[key] as object, updates),
  } as Partial<T>);

/**
 * Append to array in state immutably
 */
export const appendToState = <T extends object, K extends keyof T>(
  state: T,
  key: K,
  items: T[K] extends readonly unknown[] ? T[K][number][] : never
): T => {
  const currentArray = state[key] as readonly unknown[];
  return updateState(state, {
    [key]: Object.freeze([...currentArray, ...items]),
  } as Partial<T>);
};

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Compose multiple validators
 */
export const composeValidators =
  <T>(...validators: Array<(value: T) => Result<T, InstallError>>) =>
  (value: T): Result<T, InstallError> => {
    for (const validator of validators) {
      const result = validator(value);
      if (!result.success) return result;
    }
    return Ok(value);
  };

/**
 * Create a required field validator
 */
export const requiredField =
  <T extends object, K extends keyof T>(field: K, message?: string) =>
  (obj: T): Result<T, InstallError> => {
    if (!obj[field]) {
      return Err(
        createError('VALIDATION_ERROR', message || `Required field '${String(field)}' is missing`)
      );
    }
    return Ok(obj);
  };

/**
 * Create a type validator
 */
export const typeValidator =
  <T>(predicate: (value: unknown) => value is T, expectedType: string) =>
  (value: unknown): Result<T, InstallError> => {
    if (!predicate(value)) {
      return Err(createError('VALIDATION_ERROR', `Expected ${expectedType}, got ${typeof value}`));
    }
    return Ok(value);
  };

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Format dependency for display
 */
export const formatDependency = (name: string, version: string, current?: string): string =>
  current ? `${name} (${current} → ${version})` : `${name}@${version}`;

/**
 * Format file count summary
 */
export const formatFileSummary = (
  files: readonly string[],
  categories: readonly { name: string; pattern: string }[]
): readonly string[] =>
  categories.map(
    ({ name, pattern }) => `  • ${name}: ${countFilesByPattern(files, pattern)} files`
  );

/**
 * Format list with bullet points
 */
export const formatBulletList = (items: readonly string[], indent: number = 2): readonly string[] =>
  items.map(item => `${' '.repeat(indent)}• ${item}`);

/**
 * Format command for display
 */
export const formatCommand = (command: string, indent: number = 2): string =>
  `${' '.repeat(indent)}${command}`;

// ============================================================================
// COMPARISON UTILITIES
// ============================================================================

/**
 * Check if two arrays have the same elements (order-independent)
 */
export const arraysEqual = <T>(a: readonly T[], b: readonly T[]): boolean => {
  if (a.length !== b.length) return false;
  const bSet = new Set(b);
  return a.every(item => bSet.has(item));
};

/**
 * Get unique items from array
 */
export const unique = <T>(items: readonly T[]): readonly T[] => Array.from(new Set(items));

/**
 * Partition array based on predicate
 */
export const partition = <T>(
  items: readonly T[],
  predicate: (item: T) => boolean
): [readonly T[], readonly T[]] => {
  const pass: T[] = [];
  const fail: T[] = [];

  items.forEach(item => {
    if (predicate(item)) {
      pass.push(item);
    } else {
      fail.push(item);
    }
  });

  return [Object.freeze(pass), Object.freeze(fail)];
};

// ============================================================================
// TIMING UTILITIES
// ============================================================================

/**
 * Retry with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<Result<T, InstallError>> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();
      return Ok(result);
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  return Err(
    createError('DEPENDENCY_ERROR', `Failed after ${maxAttempts} attempts`, {
      cause: lastError instanceof Error ? lastError : undefined,
    })
  );
};

/**
 * Add timeout to promise
 */
export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Operation timed out'
): Promise<Result<T, InstallError>> => {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
  );

  return Promise.race([promise, timeoutPromise])
    .then(result => Ok(result))
    .catch(error =>
      Err(
        createError('DEPENDENCY_ERROR', error instanceof Error ? error.message : timeoutMessage, {
          cause: error instanceof Error ? error : undefined,
        })
      )
    );
};
