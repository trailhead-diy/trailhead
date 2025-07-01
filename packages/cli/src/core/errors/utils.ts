import type { Result } from './types.js';

/**
 * Type guard to check if a Result is successful
 * @param result - The Result to check
 * @returns True if the Result is successful, false otherwise
 * @example
 * ```typescript
 * const result = Ok(42);
 * if (isOk(result)) {
 *   console.log(result.value); // TypeScript knows this is safe
 * }
 * ```
 */
export function isOk<T, E = any>(
  result: Result<T, E>,
): result is { success: true; value: T } {
  return result.success === true;
}

/**
 * Type guard to check if a Result is an error
 * @param result - The Result to check
 * @returns True if the Result is an error, false otherwise
 * @example
 * ```typescript
 * const result = Err('Something went wrong');
 * if (isErr(result)) {
 *   console.log(result.error); // TypeScript knows this is safe
 * }
 * ```
 */
export function isErr<T, E = any>(
  result: Result<T, E>,
): result is { success: false; error: E } {
  return result.success === false;
}

/**
 * Unwrap a Result, throwing if it's an error
 * @param result - The Result to unwrap
 * @returns The value if successful
 * @throws Error if the Result is an error
 * @example
 * ```typescript
 * const result = Ok(42);
 * const value = unwrap(result); // 42
 *
 * const errorResult = Err('failed');
 * unwrap(errorResult); // throws Error
 * ```
 */
export function unwrap<T, E = any>(result: Result<T, E>): T {
  if (!result.success) {
    throw new Error((result.error as any).message || 'Result is an error');
  }
  return result.value;
}

/**
 * Unwrap a Result with a default value
 * @param result - The Result to unwrap
 * @param defaultValue - Value to return if Result is an error
 * @returns The value if successful, otherwise the default value
 * @example
 * ```typescript
 * const result = Err('failed');
 * const value = unwrapOr(result, 'default'); // 'default'
 *
 * const okResult = Ok(42);
 * const value2 = unwrapOr(okResult, 0); // 42
 * ```
 */
export function unwrapOr<T, E = any>(result: Result<T, E>, defaultValue: T): T {
  return result.success ? result.value : defaultValue;
}

/**
 * Map over a successful Result
 * @param result - The Result to map over
 * @param fn - Function to apply to the value if successful
 * @returns A new Result with the transformed value, or the original error
 * @example
 * ```typescript
 * const result = Ok(10);
 * const doubled = map(result, x => x * 2); // Ok(20)
 *
 * const errorResult = Err('failed');
 * const mapped = map(errorResult, x => x * 2); // Err('failed')
 * ```
 */
export function map<T, U, E = any>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> {
  if (!result.success) {
    return result;
  }
  return { success: true, value: fn(result.value) };
}

/**
 * Map over an error Result
 * @param result - The Result to map over
 * @param fn - Function to apply to the error if present
 * @returns A new Result with the transformed error, or the original value
 * @example
 * ```typescript
 * const result = Err('network error');
 * const mapped = mapErr(result, e => `Failed: ${e}`); // Err('Failed: network error')
 *
 * const okResult = Ok(42);
 * const mapped2 = mapErr(okResult, e => `Failed: ${e}`); // Ok(42)
 * ```
 */
export function mapErr<T, E = any, F = any>(
  result: Result<T, E>,
  fn: (error: E) => F,
): Result<T, F> {
  if (result.success) {
    return result;
  }
  return { success: false, error: fn(result.error) };
}

/**
 * Chain Result operations (flatMap)
 * @param result - The Result to chain from
 * @param fn - Function that returns a new Result
 * @returns The Result from fn if input is successful, otherwise the original error
 * @example
 * ```typescript
 * const result = Ok(5);
 * const chained = chain(result, x => x > 0 ? Ok(x * 2) : Err('negative')); // Ok(10)
 *
 * const errorResult = Err('failed');
 * const chained2 = chain(errorResult, x => Ok(x * 2)); // Err('failed')
 * ```
 */
export function chain<T, U, E = any>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  if (!result.success) {
    return result;
  }
  return fn(result.value);
}

/**
 * Get the value or throw with a custom error message
 * @param result - The Result to extract value from
 * @param message - Custom error message to throw
 * @returns The value if successful
 * @throws Error with custom message if the Result is an error
 * @example
 * ```typescript
 * const result = Ok(42);
 * const value = expect(result, 'Should have a value'); // 42
 *
 * const errorResult = Err('failed');
 * expect(errorResult, 'Expected a number'); // throws Error('Expected a number')
 * ```
 */
export function expect<T, E = any>(result: Result<T, E>, message: string): T {
  if (!result.success) {
    throw new Error(message);
  }
  return result.value;
}

/**
 * Convert a Result to a nullable value
 * @param result - The Result to convert
 * @returns The value if successful, null if error
 * @example
 * ```typescript
 * const result = Ok(42);
 * const value = toNullable(result); // 42
 *
 * const errorResult = Err('failed');
 * const value2 = toNullable(errorResult); // null
 * ```
 */
export function toNullable<T, E = any>(result: Result<T, E>): T | null {
  return result.success ? result.value : null;
}

/**
 * Convert a Result to an optional value
 * @param result - The Result to convert
 * @returns The value if successful, undefined if error
 * @example
 * ```typescript
 * const result = Ok(42);
 * const value = toOptional(result); // 42
 *
 * const errorResult = Err('failed');
 * const value2 = toOptional(errorResult); // undefined
 * ```
 */
export function toOptional<T, E = any>(result: Result<T, E>): T | undefined {
  return result.success ? result.value : undefined;
}

/**
 * Extract error message from a Result
 * @param result - The Result to extract error from
 * @param defaultMessage - Default message if no error message found
 * @returns Error message string, or empty string if successful
 * @example
 * ```typescript
 * const errorResult = Err(new Error('Something failed'));
 * const message = getErrorMessage(errorResult); // 'Something failed'
 *
 * const okResult = Ok(42);
 * const message2 = getErrorMessage(okResult); // ''
 * ```
 */
export function getErrorMessage<T, E = any>(
  result: Result<T, E>,
  defaultMessage: string = 'Unknown error',
): string {
  if (result.success) {
    return '';
  }
  const error = result.error as any;
  return error?.message || error?.toString() || defaultMessage;
}

/**
 * Match pattern for Result type
 * @param result - The Result to match against
 * @param handlers - Object with ok and err handler functions
 * @returns The result of calling the appropriate handler
 * @example
 * ```typescript
 * const result = Ok(42);
 * const message = match(result, {
 *   ok: value => `Success: ${value}`,
 *   err: error => `Error: ${error}`
 * }); // 'Success: 42'
 * ```
 */
export function match<T, E = any, R = any>(
  result: Result<T, E>,
  handlers: {
    ok: (value: T) => R;
    err: (error: E) => R;
  },
): R {
  return result.success
    ? handlers.ok(result.value)
    : handlers.err(result.error);
}

/**
 * Combine multiple Results into a single Result
 * @param results - Array of Results to combine
 * @returns A Result containing all values if all successful, or the first error
 * @example
 * ```typescript
 * const results = [Ok(1), Ok(2), Ok(3)];
 * const combined = all(results); // Ok([1, 2, 3])
 *
 * const mixedResults = [Ok(1), Err('failed'), Ok(3)];
 * const combined2 = all(mixedResults); // Err('failed')
 * ```
 */
export function all<T extends readonly unknown[], E = any>(results: {
  [K in keyof T]: Result<T[K], E>;
}): Result<T, E> {
  const values: any[] = [];

  for (const result of results) {
    if (!result.success) {
      return result as Result<any, E>;
    }
    values.push(result.value);
  }

  return { success: true, value: values as any };
}

/**
 * Try to execute a function and return a Result
 * @param fn - Function to execute
 * @param mapError - Optional function to transform the error
 * @returns A Result containing the function result or error
 * @example
 * ```typescript
 * const result = tryCatch(() => JSON.parse('{"valid": true}')); // Ok({valid: true})
 *
 * const errorResult = tryCatch(() => JSON.parse('invalid json')); // Err(SyntaxError)
 *
 * const mappedError = tryCatch(
 *   () => JSON.parse('invalid'),
 *   error => `Parse failed: ${error.message}`
 * ); // Err('Parse failed: ...')
 * ```
 */
export function tryCatch<T, E = Error>(
  fn: () => T,
  mapError?: (error: unknown) => E,
): Result<T, E> {
  try {
    return { success: true, value: fn() };
  } catch (error) {
    return {
      success: false,
      error: mapError ? mapError(error) : (error as E),
    };
  }
}

/**
 * Try to execute an async function and return a Result
 * @param fn - Async function to execute
 * @param mapError - Optional function to transform the error
 * @returns A Promise of Result containing the function result or error
 * @example
 * ```typescript
 * const result = await tryCatchAsync(async () => {
 *   const response = await fetch('/api/data');
 *   return response.json();
 * }); // Ok(data) or Err(error)
 *
 * const mappedResult = await tryCatchAsync(
 *   () => fetch('/api/data'),
 *   error => `Network error: ${error.message}`
 * );
 * ```
 */
export async function tryCatchAsync<T, E = Error>(
  fn: () => Promise<T>,
  mapError?: (error: unknown) => E,
): Promise<Result<T, E>> {
  try {
    const value = await fn();
    return { success: true, value };
  } catch (error) {
    return {
      success: false,
      error: mapError ? mapError(error) : (error as E),
    };
  }
}
