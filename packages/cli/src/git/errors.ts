import { CLIError } from '../core/index.js';

/**
 * Create a simple git error
 */
export function createGitError(message: string, details?: string): CLIError {
  return {
    code: 'GIT_ERROR',
    message,
    details,
    recoverable: true,
  };
}
