// Simple error classification and retry with p-retry
import { default as pRetry } from 'p-retry';
export { default as pRetry } from 'p-retry';
export type { Options as RetryOptions } from 'p-retry';

export type ErrorCategory =
  | 'network'
  | 'permission'
  | 'filesystem'
  | 'validation'
  | 'configuration'
  | 'dependency'
  | 'unknown';

export function classifyError(error: Error): ErrorCategory {
  const message = error.message.toLowerCase();

  if (
    message.includes('timeout') ||
    message.includes('enotfound') ||
    message.includes('econnrefused')
  ) {
    return 'network';
  }

  if (
    message.includes('permission denied') ||
    message.includes('eacces') ||
    message.includes('eperm')
  ) {
    return 'permission';
  }

  if (message.includes('enoent') || message.includes('no such file')) {
    return 'filesystem';
  }

  if (
    message.includes('validation') ||
    message.includes('invalid input') ||
    message.includes('schema')
  ) {
    return 'validation';
  }

  if (
    message.includes('invalid config') ||
    message.includes('malformed') ||
    message.includes('parse error')
  ) {
    return 'configuration';
  }

  if (
    message.includes('conflict') ||
    message.includes('peer dep') ||
    message.includes('version mismatch')
  ) {
    return 'dependency';
  }

  return 'unknown';
}

export function isRetryableError(error: Error): boolean {
  const category = classifyError(error);
  return category === 'network' || category === 'filesystem';
}

export async function retryableOperation<T>(
  operation: () => Promise<T>,
  options?: {
    retries?: number;
    factor?: number;
    minTimeout?: number;
    maxTimeout?: number;
  },
): Promise<T> {
  return pRetry(operation, {
    retries: options?.retries ?? 3,
    factor: options?.factor ?? 2,
    minTimeout: options?.minTimeout ?? 1000,
    maxTimeout: options?.maxTimeout ?? 5000,
    onFailedAttempt: (error) => {
      if (!isRetryableError(error)) {
        throw error;
      }
    },
  });
}
