/**
 * @module core/errors
 * @description Core error handling system providing Result-based error management and utilities.
 *
 * This module exports comprehensive error handling utilities including Result types,
 * error factories, and utility functions for building robust error handling patterns
 * throughout the Trailhead system.
 *
 * @example
 * ```typescript
 * import { ok, err, createCoreError } from '@trailhead/core/errors'
 *
 * function divide(a: number, b: number): Result<number, CoreError> {
 *   if (b === 0) {
 *     return err(createCoreError(
 *       'DIVISION_BY_ZERO',
 *       'MATH_ERROR',
 *       'Cannot divide by zero',
 *       { recoverable: false }
 *     ))
 *   }
 *   return ok(a / b)
 * }
 * ```
 *
 * @since 0.1.0
 */

/** Core neverthrow types and utilities */
export * from './types.js'
export * from './utils.js'

/** Functional error factories for creating standardized errors */
export * from './factory.js'
