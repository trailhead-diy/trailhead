import type { CoreError, ErrorContext } from './types.js';

/**
 * Foundation error factory - minimal and extensible
 */
export const createCoreError = (
  type: string,
  message: string,
  options?: {
    details?: string;
    cause?: unknown;
    suggestion?: string;
    recoverable?: boolean;
    context?: Record<string, unknown>;
  }
): CoreError => ({
  type,
  message,
  details: options?.details,
  cause: options?.cause,
  suggestion: options?.suggestion,
  recoverable: options?.recoverable ?? false,
  context: options?.context,
});

/**
 * Add context to any error
 */
export const withContext = <E extends CoreError>(error: E, context: Partial<ErrorContext>): E => ({
  ...error,
  details: [
    error.details,
    context.operation && `Operation: ${context.operation}`,
    context.component && `Component: ${context.component}`,
  ]
    .filter(Boolean)
    .join('\n'),
  context: {
    ...error.context,
    ...context,
  },
});

/**
 * Chain errors together for error propagation
 */
export const chainError = <E extends CoreError>(
  error: E,
  cause: CoreError | Error | unknown
): E => ({
  ...error,
  cause,
});
