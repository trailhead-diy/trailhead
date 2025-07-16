import { type Result, ResultAsync, err, ok } from 'neverthrow'
import type { CoreError } from '../errors/types.js'

/**
 * Convert a Promise to ResultAsync with foundation error handling
 */
export const fromPromise = <T>(
  promise: Promise<T>,
  errorHandler?: (error: unknown) => CoreError
): ResultAsync<T, CoreError> => {
  return ResultAsync.fromPromise(
    promise,
    errorHandler ||
      ((error) =>
        ({
          type: 'ASYNC_ERROR',
          message: error instanceof Error ? error.message : 'Unknown async error',
          cause: error,
          recoverable: false,
        }) as CoreError)
  )
}

/**
 * Convert a function that throws to a safe Result
 */
export const fromThrowable = <T, Args extends readonly unknown[]>(
  fn: (...args: Args) => T,
  errorHandler?: (error: unknown) => CoreError
): ((...args: Args) => Result<T, CoreError>) => {
  return (...args: Args): Result<T, CoreError> => {
    try {
      const result = fn(...args)
      return ok(result)
    } catch (error) {
      const coreError = errorHandler
        ? errorHandler(error)
        : ({
            type: 'THROWABLE_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
            cause: error,
            recoverable: false,
          } as CoreError)
      return err(coreError)
    }
  }
}

/**
 * Convert an async function that throws to a safe ResultAsync
 */
export const fromThrowableAsync = <T, Args extends readonly unknown[]>(
  fn: (...args: Args) => Promise<T>,
  errorHandler?: (error: unknown) => CoreError
): ((...args: Args) => ResultAsync<T, CoreError>) => {
  return (...args: Args): ResultAsync<T, CoreError> => {
    return fromPromise(fn(...args), errorHandler)
  }
}
