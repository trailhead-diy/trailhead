// Re-export all error factories from @trailhead/core for backward compatibility
export {
  createTrailheadError as createError,
  createSeverityError,
  createValidationError as validationError,
  createRequiredFieldError as requiredFieldError,
  createInvalidTypeError as invalidTypeError,
  createFileSystemError as fileSystemError,
  createFileNotFoundError as fileNotFoundError,
  createDirectoryNotFoundError as directoryNotFoundError,
  createPermissionError as permissionError,
  createNetworkError as networkError,
  createHttpError as httpError,
  createConfigurationError as configurationError,
  createDataError as dataError,
  createGitError as gitError,
  createCLIError as cliError,
  createDatabaseError as databaseError,
  withContext,
  chainError,
} from '@trailhead/core';

// Legacy function names for backward compatibility
export {
  createHttpError as timeoutError,
  createConfigurationError as missingConfigError,
  createConfigurationError as invalidConfigFieldError,
  createConfigurationError as invalidConfigValueError,
  createCLIError as executionError,
  createCLIError as commandNotFoundError,
  createValidationError as userInputError,
  createValidationError as invalidInputError,
  createDependencyError as dependencyError,
  createDependencyError as missingDependencyError,
} from '@trailhead/core';
