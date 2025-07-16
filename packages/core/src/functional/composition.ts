// Foundation functional utilities using fp-ts
// Re-export essential fp-ts functions for the Trailhead ecosystem

// Core composition and pipeline functions
export { pipe, flow, identity, constant } from 'fp-ts/lib/function.js'

// Result type utilities - bridge between fp-ts and neverthrow patterns
import { type Result, ResultAsync, err } from 'neverthrow'

/**
 * Compose functions that return Result types
 * Uses fp-ts patterns for consistency
 */
export const composeResult =
  <A, B, C, E>(f: (b: B) => Result<C, E>, g: (a: A) => Result<B, E>) =>
  (a: A): Result<C, E> => {
    const resultB = g(a)
    if (resultB.isErr()) return err(resultB.error)
    return f(resultB.value)
  }

/**
 * Async composition for ResultAsync types
 */
export const composeResultAsync =
  <A, B, C, E>(f: (b: B) => ResultAsync<C, E>, g: (a: A) => ResultAsync<B, E>) =>
  (a: A): ResultAsync<C, E> =>
    g(a).andThen(f)

/**
 * Tap function for side effects - foundation utility
 */
export const tap =
  <T>(fn: (value: T) => void) =>
  (value: T): T => {
    fn(value)
    return value
  }
