/**
 * Backward compatibility assertions for v3.x tests
 *
 * These are provided for packages still using old testing patterns.
 * New tests should use vitest's expect() directly with Result methods.
 *
 * @deprecated Use expect(result.isOk()).toBe(true) instead
 */

import type { Result } from '@trailhead/core'

/**
 * Assert that a Result is Ok (success)
 * @deprecated Use expect(result.isOk()).toBe(true)
 */
export function expectSuccess<T, E>(result: Result<T, E>): void {
  if (result.isErr()) {
    throw new Error(`Expected success but got error: ${JSON.stringify(result.error)}`)
  }
}

/**
 * Assert that a Result is Err (error)
 * @deprecated Use expect(result.isErr()).toBe(true)
 */
export function expectError<T, E>(result: Result<T, E>): void {
  if (result.isOk()) {
    throw new Error(`Expected error but got success: ${JSON.stringify(result.value)}`)
  }
}

/**
 * Alias for expectError
 * @deprecated Use expect(result.isErr()).toBe(true)
 */
export const expectFailure = expectError
