import chalk from 'chalk';
import pRetry, { AbortError } from 'p-retry';
import type {
  CLIError,
  Result,
  AsyncResult,
  ErrorCategory,
  ErrorSeverity,
  SeverityError,
  ErrorChain,
} from './types.js';
import { RetryableError } from './retry-error.js';

export function formatError(error: CLIError, verbose: boolean = false): string[] {
  const lines: string[] = [];

  // Main error message
  const icon = getErrorIcon(error);
  lines.push(`${icon} ${error.message}`);

  // Details if available
  if (error.details && (verbose || !error.suggestion)) {
    lines.push(chalk.gray(`   ${error.details}`));
  }

  // Suggestion if available
  if (error.suggestion) {
    lines.push(chalk.yellow(`   💡 ${error.suggestion}`));
  }

  // Error code in verbose mode
  if (verbose && error.code) {
    lines.push(chalk.gray(`   Code: ${error.code}`));
  }

  // Cause in verbose mode
  if (verbose && error.cause) {
    lines.push(chalk.gray('   Caused by:'));
    if (error.cause instanceof Error) {
      lines.push(chalk.gray(`   ${error.cause.message}`));
      if (error.cause.stack) {
        lines.push(chalk.gray('   Stack:'));
        error.cause.stack.split('\n').forEach(line => {
          lines.push(chalk.gray(`     ${line}`));
        });
      }
    } else {
      lines.push(chalk.gray(`   ${String(error.cause)}`));
    }
  }

  return lines;
}

function getErrorIcon(error: CLIError): string {
  if ('severity' in error) {
    const severityError = error as SeverityError;
    switch (severityError.severity) {
      case 'fatal':
        return chalk.red('💀');
      case 'error':
        return chalk.red('❌');
      case 'warning':
        return chalk.yellow('⚠️');
      case 'info':
        return chalk.blue('ℹ️');
    }
  }

  if ('category' in error) {
    switch ((error as any).category as ErrorCategory) {
      case 'validation':
        return chalk.red('✗');
      case 'filesystem':
        return chalk.red('📁');
      case 'network':
        return chalk.red('🌐');
      case 'configuration':
        return chalk.red('⚙️');
      case 'execution':
        return chalk.red('🔧');
      case 'user-input':
        return chalk.red('👤');
      case 'dependency':
        return chalk.red('📦');
      default:
        return chalk.red('❌');
    }
  }

  return chalk.red('❌');
}

export function displayError(error: CLIError, verbose: boolean = false): void {
  const lines = formatError(error, verbose);
  lines.forEach(line => console.error(line));
}

export function displayErrorChain(chain: ErrorChain, verbose: boolean = false): void {
  console.error(chalk.red('Error chain:'));

  // Display primary error
  const primaryLines = formatError(chain.error, verbose);
  primaryLines.forEach(line => console.error(`  ${line}`));

  // Display chain if any
  if (chain.chain.length > 0) {
    console.error(chalk.gray('\n  Caused by:'));
    chain.chain.forEach((error, index) => {
      const lines = formatError(error, verbose);
      lines.forEach(line => console.error(`    ${index + 1}. ${line}`));
    });
  }
}

export type ErrorHandler<E extends CLIError = CLIError> = (error: E) => void | Promise<void>;

export function createExitHandler(exitCode: number = 1, verbose: boolean = false): ErrorHandler {
  return error => {
    displayError(error, verbose);
    process.exit(exitCode);
  };
}

export function createLogHandler(prefix?: string, verbose: boolean = false): ErrorHandler {
  return error => {
    if (prefix) {
      console.error(chalk.gray(prefix));
    }
    displayError(error, verbose);
  };
}

export function createConditionalHandler<E extends CLIError>(
  condition: (error: E) => boolean,
  trueHandler: ErrorHandler<E>,
  falseHandler?: ErrorHandler<E>
): ErrorHandler<E> {
  return error => {
    if (condition(error)) {
      return trueHandler(error);
    }

    if (falseHandler) {
      return falseHandler(error);
    }
  };
}

export async function tryRecover<T, E extends CLIError>(
  result: Result<T, E>,
  recovery: (error: E) => AsyncResult<T, E>
): AsyncResult<T, E> {
  if (result.success) {
    return result;
  }

  if (result.error.recoverable) {
    return recovery(result.error);
  }

  return result;
}

/**
 * Retry an operation with exponential backoff using p-retry
 *
 * @param operation - Async function that returns a Result type
 * @param options - Retry configuration options
 * @param options.maxRetries - Maximum number of retry attempts (default: 3)
 * @param options.initialDelay - Initial delay in milliseconds (default: 1000)
 * @param options.maxDelay - Maximum delay between retries in milliseconds (default: 30000)
 * @param options.factor - Exponential backoff factor (default: 2)
 * @param options.shouldRetry - Function to determine if an error should be retried (default: checks error.recoverable)
 * @returns Promise resolving to Result<T, E>
 *
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   async () => {
 *     const response = await fetch('/api/data');
 *     if (!response.ok) {
 *       return Err({ code: 'API_ERROR', message: 'Failed', recoverable: true });
 *     }
 *     return Ok(await response.json());
 *   },
 *   { maxRetries: 5, initialDelay: 500 }
 * );
 * ```
 */
export async function retryWithBackoff<T, E extends CLIError>(
  operation: () => AsyncResult<T, E>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
    shouldRetry?: (error: E) => boolean;
  } = {}
): AsyncResult<T, E> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    factor = 2,
    shouldRetry = error => error.recoverable,
  } = options;

  let lastError: E | undefined;

  try {
    const result = await pRetry(
      async () => {
        const operationResult = await operation();

        if (operationResult.success) {
          return operationResult;
        }

        lastError = operationResult.error;

        // Check if we should retry this error
        if (!shouldRetry(operationResult.error)) {
          // Don't retry - throw a special error to stop p-retry
          throw new AbortError(operationResult.error.message);
        }

        // Throw a RetryableError to trigger retry (p-retry requires Error instances)
        throw new RetryableError(operationResult.error.message, operationResult.error);
      },
      {
        retries: maxRetries,
        minTimeout: initialDelay,
        maxTimeout: maxDelay,
        factor: factor,
        onFailedAttempt: error => {
          // p-retry provides attempt number and retriesLeft
          if (error.retriesLeft === 0) {
            // This is the last attempt
            return;
          }
        },
      }
    );

    return result;
  } catch (error) {
    // Handle abort errors (non-retryable errors)
    if (error instanceof AbortError && lastError) {
      return { success: false, error: lastError };
    }

    // Handle other errors (exhausted retries)
    if (lastError) {
      return { success: false, error: lastError };
    }

    // Fallback error (shouldn't happen)
    return {
      success: false,
      error: {
        code: 'RETRY_FAILED',
        message: error instanceof Error ? error.message : 'Unknown retry error',
        recoverable: false,
      } as E,
    };
  }
}

export function mapError<T, E1 extends CLIError, E2 extends CLIError>(
  result: Result<T, E1>,
  mapper: (error: E1) => E2
): Result<T, E2> {
  if (result.success) {
    return result;
  }

  return {
    success: false,
    error: mapper(result.error),
  };
}

export async function mapErrorAsync<T, E1 extends CLIError, E2 extends CLIError>(
  result: AsyncResult<T, E1>,
  mapper: (error: E1) => E2 | Promise<E2>
): AsyncResult<T, E2> {
  const awaited = await result;

  if (awaited.success) {
    return awaited;
  }

  return {
    success: false,
    error: await mapper(awaited.error),
  };
}

export function aggregateErrors(errors: CLIError[]): CLIError {
  if (errors.length === 0) {
    return {
      code: 'NO_ERRORS',
      message: 'No errors',
      recoverable: true,
    };
  }

  if (errors.length === 1) {
    return errors[0];
  }

  return {
    code: 'MULTIPLE_ERRORS',
    message: `Multiple errors occurred (${errors.length} total)`,
    details: errors.map((e, i) => `${i + 1}. ${e.message}`).join('\n'),
    recoverable: errors.every(e => e.recoverable),
  };
}

export function collectErrors<T, E extends CLIError>(
  results: Result<T, E>[]
): { values: T[]; errors: E[] } {
  const values: T[] = [];
  const errors: E[] = [];

  for (const result of results) {
    if (result.success) {
      values.push(result.value);
    } else {
      errors.push(result.error);
    }
  }

  return { values, errors };
}

export function buildErrorChain(errors: CLIError[]): ErrorChain {
  if (errors.length === 0) {
    throw new Error('Cannot build error chain from empty array');
  }

  return {
    error: errors[0],
    chain: errors.slice(1),
  };
}

export function addToChain(chain: ErrorChain, error: CLIError): ErrorChain {
  return {
    error: chain.error,
    chain: [...chain.chain, error],
  };
}

export function filterByCategory<E extends CLIError>(errors: E[], category: ErrorCategory): E[] {
  return errors.filter(e => 'category' in e && (e as any).category === category);
}

export function filterRecoverable<E extends CLIError>(errors: E[]): E[] {
  return errors.filter(e => e.recoverable);
}

export function filterBySeverity<E extends CLIError>(errors: E[], severity: ErrorSeverity): E[] {
  return errors.filter(e => 'severity' in e && (e as any).severity === severity);
}
