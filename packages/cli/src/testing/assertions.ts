import type { Result } from '../core/errors/index.js';

/**
 * Assert that a Result is successful
 */
export function expectResult<T>(result: Result<T>): asserts result is { success: true; value: T } {
  if (!result.success) {
    throw new Error(`Expected successful result, but got error: ${result.error.message}`);
  }
}

/**
 * Assert that a Result is an error
 */
export function expectError<E = any>(
  result: Result<any, E>
): asserts result is { success: false; error: E } {
  if (result.success) {
    throw new Error('Expected error result, but operation succeeded');
  }
}
