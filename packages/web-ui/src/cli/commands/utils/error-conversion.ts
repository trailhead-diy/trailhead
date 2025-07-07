/**
 * Error conversion utilities
 */

import type { Result as CLIResult, CLIError } from '@esteban-url/trailhead-cli/core';

// Import local installation types
import type { InstallError, Result as InstallResult } from '../../core/installation/types.js';

/**
 * Convert InstallError to CLIError (pass-through since they're the same type now)
 */
export function installErrorToCLIError(error: InstallError): CLIError {
  // Since InstallError is now an alias for CLIError, just return it directly
  return error;
}

/**
 * Convert InstallError Result to CLIError Result
 */
export function convertInstallResult<T>(result: InstallResult<T, InstallError>): CLIResult<T> {
  if (result.success) {
    return { success: true, value: result.value };
  }
  return { success: false, error: installErrorToCLIError(result.error) };
}
