/**
 * @module cli/utils/spinner
 * @description Spinner utilities for CLI loading indicators built on Clack.
 *
 * Provides spinner utilities for CLI applications with beautiful, consistent UI.
 * Built on top of @clack/prompts for modern terminal support.
 *
 * @since 2.0.0
 */
import { spinner as clackSpinner } from '@clack/prompts'

/**
 * Spinner instance interface matching the API consumers expect
 */
export interface Spinner {
  /** Start the spinner with optional initial message */
  start: (message?: string) => void
  /** Stop the spinner with a success message */
  stop: (message?: string) => void
  /** Stop the spinner with a success message (alias for stop) */
  success: (message?: string) => void
  /** Stop the spinner with an error message */
  error: (message?: string) => void
  /** Update the spinner message while running */
  message: (message: string) => void
}

/**
 * Create a spinner with standard configuration
 * @param text - Text to display next to the spinner
 * @returns Configured spinner instance
 * @example
 * ```typescript
 * const spinner = createSpinner('Loading...');
 * spinner.start();
 * // ... do work ...
 * spinner.success('Done!');
 * ```
 */
export function createSpinner(text: string): Spinner {
  const s = clackSpinner()
  let started = false

  return {
    start: (message?: string) => {
      started = true
      s.start(message ?? text)
    },
    stop: (message?: string) => {
      if (started) {
        s.stop(message ?? text)
      }
    },
    success: (message?: string) => {
      if (started) {
        s.stop(message ?? 'Done')
      }
    },
    error: (message?: string) => {
      if (started) {
        s.stop(message ?? 'Failed')
      }
    },
    message: (message: string) => {
      if (started) {
        s.message(message)
      }
    },
  }
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
export async function withSpinner<T>(text: string, fn: () => Promise<T>): Promise<T> {
  const s = clackSpinner()
  s.start(text)

  try {
    const result = await fn()
    s.stop('Done')
    return result
  } catch (error) {
    s.stop('Failed')
    throw error
  }
}
