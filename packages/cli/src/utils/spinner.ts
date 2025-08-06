/**
 * @module cli/utils/spinner
 * @description Spinner utilities for CLI loading indicators built on yocto-spinner.
 *
 * Provides lightweight spinner utilities for CLI applications with minimal bundle size.
 * Built on top of yocto-spinner for cross-platform compatibility and modern terminal support.
 *
 * @since 0.1.0
 */
import yoctoSpinner from 'yocto-spinner'

/**
 * Create a spinner with standard configuration
 * @param text - Text to display next to the spinner
 * @returns Configured yocto-spinner instance
 * @example
 * ```typescript
 * const spinner = createSpinner('Loading...');
 * spinner.start();
 * // ... do work ...
 * spinner.success();
 * ```
 */
export function createSpinner(text: string) {
  return yoctoSpinner({
    text,
  })
}

/**
 * Execute an async function with a spinner
 *
 * Wraps an async function with a spinner that automatically starts before execution
 * and stops with success/error status based on the function result. Provides visual
 * feedback for long-running operations.
 *
 * @template T - Return type of the async function
 * @param text - Text to display during execution
 * @param fn - Async function to execute
 * @returns Promise that resolves to the function result or rejects with the error
 * @throws Re-throws any error from the wrapped function after updating spinner
 *
 * @example
 * ```typescript
 * const result = await withSpinner('Fetching data...', async () => {
 *   const response = await fetch('/api/data');
 *   return response.json();
 * });
 * // Spinner automatically succeeds on completion or fails on error
 * ```
 */
export function withSpinner<T>(text: string, fn: () => Promise<T>): Promise<T> {
  const spinner = createSpinner(text)
  spinner.start()

  return fn()
    .then((result) => {
      spinner.success()
      return result
    })
    .catch((error) => {
      spinner.error()
      throw error
    })
}
