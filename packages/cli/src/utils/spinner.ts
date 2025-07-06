/**
 * Spinner utilities for CLI loading indicators
 * Built on yocto-spinner for minimal bundle size
 */
import yoctoSpinner from 'yocto-spinner';

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
  });
}

/**
 * Execute an async function with a spinner
 * @param text - Text to display during execution
 * @param fn - Async function to execute
 * @returns Promise that resolves to the function result
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
  const spinner = createSpinner(text);
  spinner.start();

  return fn()
    .then((result) => {
      spinner.success();
      return result;
    })
    .catch((error) => {
      spinner.error();
      throw error;
    });
}
