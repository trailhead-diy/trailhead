import { createCoreError, type CoreError } from '../core/index.js';

/**
 * Create a simple git error
 */
export function createGitError(message: string, details?: string): CoreError {
  return createCoreError('GIT_ERROR', message, {
    recoverable: true,
    context: { details },
  });
}
