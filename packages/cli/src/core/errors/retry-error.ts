import type { CLIError } from './types.js';

/**
 * Custom error class that wraps CLIError for p-retry compatibility
 *
 * p-retry requires actual Error instances to be thrown, so we wrap
 * our CLIError in a proper Error class while maintaining type safety.
 *
 * @example
 * ```typescript
 * // Instead of using type casting:
 * const error = new Error(cliError.message);
 * (error as any).cliError = cliError;
 *
 * // Use RetryableError for type safety:
 * throw new RetryableError(cliError.message, cliError);
 * ```
 */
export class RetryableError<E extends CLIError = CLIError> extends Error {
  constructor(
    message: string,
    public readonly cliError: E,
  ) {
    super(message);
    this.name = 'RetryableError';
  }
}
