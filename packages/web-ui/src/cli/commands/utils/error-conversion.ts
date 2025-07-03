/**
 * Error conversion utilities
 */

import type { Result as CLIResult, CLIError } from '@esteban-url/trailhead-cli/core'

// Import local installation types
import type { InstallError, Result as InstallResult } from '../../core/installation/types.js'

/**
 * Convert InstallError to CLIError
 */
export function installErrorToCLIError(error: InstallError): CLIError {
  const baseError = {
    message: error.message,
    details: 'details' in error ? error.details : undefined,
    cause: 'cause' in error ? error.cause : undefined,
    recoverable: error.type !== 'FileSystemError',
  }

  switch (error.type) {
    case 'ConfigurationError':
      return { code: 'CONFIG_ERROR', ...baseError }
    case 'ValidationError':
      return {
        code: 'VALIDATION_ERROR',
        ...baseError,
        details: error.field ? `Field: ${error.field}` : baseError.details,
      }
    case 'FileSystemError':
      return {
        code: 'FS_ERROR',
        ...baseError,
        details: error.path ? `Path: ${error.path}` : baseError.details,
      }
    case 'DependencyError':
      return {
        code: 'DEPENDENCY_ERROR',
        ...baseError,
        details: error.packageName ? `Package: ${error.packageName}` : baseError.details,
      }
    case 'ConversionError':
      return { code: 'CONVERSION_ERROR', ...baseError }
    case 'VerificationError':
      return { code: 'VERIFICATION_ERROR', ...baseError }
    case 'UserInputError':
      return { code: 'USER_INPUT_ERROR', ...baseError }
    default:
      return {
        code: 'UNKNOWN_ERROR',
        ...baseError,
        message: (error as any).message || 'Unknown error',
      }
  }
}

/**
 * Convert InstallError Result to CLIError Result
 */
export function convertInstallResult<T>(result: InstallResult<T, InstallError>): CLIResult<T> {
  if (result.success) {
    return { success: true, value: result.value }
  }
  return { success: false, error: installErrorToCLIError(result.error) }
}
