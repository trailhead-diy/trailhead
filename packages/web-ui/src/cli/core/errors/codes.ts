/**
 * Standardized error codes for Trailhead UI CLI commands
 * 
 * Provides consistent error categorization across all commands
 * for better error handling and debugging.
 */

export const CLI_ERROR_CODES = {
  // Validation Errors (1xx)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFIG_ERROR: 'CONFIG_ERROR',
  USER_INPUT_ERROR: 'USER_INPUT_ERROR',
  
  // File System Errors (2xx) 
  FS_ERROR: 'FS_ERROR',
  PATH_NOT_FOUND: 'PATH_NOT_FOUND',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  
  // Installation Errors (3xx)
  INSTALL_ERROR: 'INSTALL_ERROR',
  DEPENDENCY_ERROR: 'DEPENDENCY_ERROR',
  FRAMEWORK_ERROR: 'FRAMEWORK_ERROR',
  
  // Transform Errors (4xx)
  TRANSFORM_ERROR: 'TRANSFORM_ERROR',
  DRY_RUN_ERROR: 'DRY_RUN_ERROR',
  CONVERSION_ERROR: 'CONVERSION_ERROR',
  
  // System Errors (5xx)
  SUBPROCESS_ERROR: 'SUBPROCESS_ERROR',
  PROMPT_ERROR: 'PROMPT_ERROR',
  USER_CANCELLED: 'USER_CANCELLED',
  
  // Unknown/Generic (9xx)
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  VERIFICATION_ERROR: 'VERIFICATION_ERROR',
} as const

export type CLIErrorCode = typeof CLI_ERROR_CODES[keyof typeof CLI_ERROR_CODES]

/**
 * Create standardized error object with consistent code
 */
export function createCLIError(
  code: CLIErrorCode,
  message: string,
  options: {
    details?: string
    recoverable?: boolean
    suggestion?: string
  } = {}
) {
  return {
    code,
    message,
    details: options.details,
    recoverable: options.recoverable ?? true,
    suggestion: options.suggestion,
  }
}