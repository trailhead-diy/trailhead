/**
 * @module functional/composition
 * @description Functional composition utilities for Result types and general function composition
 */

/**
 * Core composition and pipeline functions from fp-ts.
 *
 * @example
 * ```typescript
 * import { pipe, flow } from '@trailhead/core'
 *
 * // Using pipe for data transformation
 * const result = pipe(
 *   5,
 *   x => x * 2,
 *   x => x + 1,
 *   x => `Result: ${x}`
 * ) // 'Result: 11'
 *
 * // Using flow for function composition
 * const addThenDouble = flow(
 *   (x: number) => x + 1,
 *   x => x * 2
 * )
 * addThenDouble(5) // 12
 * ```
 */
export { pipe, flow, identity, constant } from 'fp-ts/lib/function.js'

import { type Result, ResultAsync, err } from 'neverthrow'

/**
 * Compose two functions that return Result types.
 * If the first function returns an error, it short-circuits.
 *
 * @template A - Input type
 * @template B - Intermediate type
 * @template C - Output type
 * @template E - Error type
 * @param f - Second function to apply
 * @param g - First function to apply
 * @returns Composed function that returns a Result
 *
 * @example
 * ```typescript
 * const parseNumber = (s: string): Result<number, string> =>
 *   isNaN(+s) ? err('Not a number') : ok(+s)
 *
 * const doubleNumber = (n: number): Result<number, string> =>
 *   n > 1000 ? err('Too large') : ok(n * 2)
 *
 * const parseAndDouble = composeResult(doubleNumber, parseNumber)
 *
 * parseAndDouble('5') // Ok(10)
 * parseAndDouble('abc') // Err('Not a number')
 * parseAndDouble('600') // Err('Too large')
 * ```
 */
export const composeResult =
  <A, B, C, E>(f: (b: B) => Result<C, E>, g: (a: A) => Result<B, E>) =>
  (a: A): Result<C, E> => {
    const resultB = g(a)
    if (resultB.isErr()) return err(resultB.error)
    return f(resultB.value)
  }

/**
 * Compose two async functions that return ResultAsync types.
 * Handles asynchronous operations with proper error propagation.
 *
 * @template A - Input type
 * @template B - Intermediate type
 * @template C - Output type
 * @template E - Error type
 * @param f - Second async function to apply
 * @param g - First async function to apply
 * @returns Composed function that returns a ResultAsync
 *
 * @example
 * ```typescript
 * const fetchUser = (id: string): ResultAsync<User, string> =>
 *   fromPromise(api.getUser(id), e => 'Failed to fetch user')
 *
 * const fetchPosts = (user: User): ResultAsync<Post[], string> =>
 *   fromPromise(api.getUserPosts(user.id), e => 'Failed to fetch posts')
 *
 * const fetchUserPosts = composeResultAsync(fetchPosts, fetchUser)
 *
 * const posts = await fetchUserPosts('123')
 * ```
 */
export const composeResultAsync =
  <A, B, C, E>(f: (b: B) => ResultAsync<C, E>, g: (a: A) => ResultAsync<B, E>) =>
  (a: A): ResultAsync<C, E> =>
    g(a).andThen(f)

/**
 * Execute a side effect without affecting the value flow.
 * Useful for logging, debugging, or triggering external effects.
 *
 * @template T - The type of value
 * @param fn - Side effect function to execute
 * @returns Function that executes side effect and returns original value
 *
 * @example
 * ```typescript
 * const result = pipe(
 *   userData,
 *   tap(data => console.log('Processing user:', data.id)),
 *   transformUser,
 *   tap(user => analytics.track('user.transformed', { id: user.id })),
 *   saveUser
 * )
 * ```
 */
export const tap =
  <T>(fn: (value: T) => void) =>
  (value: T): T => {
    fn(value)
    return value
  }
