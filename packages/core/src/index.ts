/**
 * @module @esteban-url/core
 * @description Foundation package for the Trailhead System providing Result-based error handling.
 *
 * This package exports functional programming utilities centered around the Result type pattern,
 * enabling explicit error handling without exceptions. Built on top of neverthrow and fp-ts.
 *
 * @example
 * ```typescript
 * import { ok, err, Result } from '@esteban-url/core'
 *
 * function divide(a: number, b: number): Result<number, string> {
 *   if (b === 0) return err('Division by zero')
 *   return ok(a / b)
 * }
 *
 * const result = divide(10, 2)
 * if (result.isOk()) {
 *   console.log('Result:', result.value) // 5
 * }
 * ```
 *
 * @since 0.1.0
 */

/**
 * Core Result type utilities - the foundation of error handling.
 * @see {@link https://github.com/supermacro/neverthrow} Based on neverthrow
 */
export { ok, err } from './errors/index.js'
export type { Result, CoreResult, CoreResultAsync } from './errors/index.js'

/** Error system exports - comprehensive error handling utilities */
export * from './errors/index.js'

/** Functional programming utilities - composition and pipeline functions */
export * from './functional/composition.js'

/** Async utilities - Promise and async function integration with Result types */
export {
  fromPromise as fromPromiseAsync,
  fromThrowable as fromThrowableAsync,
  fromThrowableAsync as fromThrowableAsyncFunc,
} from './functional/async.js'

/** Essential utilities for CLI applications - colors and formatting */
export * from './utils/index.js'
