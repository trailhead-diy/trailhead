import { createCLIError, CLIError } from '../core/index.js';

/**
 * Create a simple git error
 */
export function createGitError(message: string, details?: string): CLIError {
  return createCLIError(message, {
    context: { details },
  });
}
