/**
 * @esteban-url/core/testing
 *
 * Core testing utilities for Result types and error handling.
 * Provides the foundation for testing functional programming patterns.
 *
 * @example
 * ```typescript
 * import {
 *   // Result utilities
 *   createOkResult, createErrResult, assertOk, unwrapOk,
 *   // Error factories
 *   createValidationError, createFsError, createTestError,
 *   // Async utilities
 *   createAsyncOk, fromPromise, chainAsync
 * } from '@esteban-url/core/testing'
 *
 * // Test Result types
 * const result = createOkResult('success')
 * assertOk(result)
 * expect(unwrapOk(result)).toBe('success')
 *
 * // Create typed errors
 * const error = createValidationError('Required field', 'email')
 * expect(error.code).toBe('VALIDATION_ERROR')
 *
 * // Test async operations
 * const asyncResult = await fromPromise(fetch('/api'))
 * if (asyncResult.isOk()) {
 *   // Handle success
 * }
 * ```
 */

export * from './result-helpers.js'
export * from './error-factories.js'
export * from './async-helpers.js'
