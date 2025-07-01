import type {
  CLIError,
  ValidationError,
  FileSystemError,
  NetworkError,
  ConfigurationError,
  ExecutionError,
  UserInputError,
  DependencyError,
  Result,
  ErrorContext,
  ErrorSeverity,
  SeverityError,
} from './types.js';

export const Ok = <T>(value: T): Result<T, never> => ({
  success: true,
  value,
});

export const Err = <E extends CLIError>(error: E): Result<never, E> => ({
  success: false,
  error,
});

export function createError(
  code: string,
  message: string,
  options?: {
    details?: string;
    cause?: unknown;
    suggestion?: string;
    recoverable?: boolean;
  },
): CLIError {
  return {
    code,
    message,
    details: options?.details,
    cause: options?.cause,
    suggestion: options?.suggestion,
    recoverable: options?.recoverable ?? false,
  };
}

export function createSeverityError(
  error: CLIError,
  severity: ErrorSeverity,
): SeverityError {
  return {
    ...error,
    severity,
  };
}

export function validationError(
  message: string,
  options?: {
    field?: string;
    value?: unknown;
    constraints?: Record<string, unknown>;
    suggestion?: string;
  },
): ValidationError {
  return {
    category: 'validation',
    code: 'VALIDATION_ERROR',
    message,
    field: options?.field,
    value: options?.value,
    constraints: options?.constraints,
    suggestion: options?.suggestion,
    recoverable: true,
  };
}

export function requiredFieldError(field: string): ValidationError {
  return validationError(`Required field '${field}' is missing`, {
    field,
    suggestion: `Provide a value for '${field}'`,
  });
}

export function invalidTypeError(
  field: string,
  expectedType: string,
  actualValue: unknown,
): ValidationError {
  const actualType = Array.isArray(actualValue) ? 'array' : typeof actualValue;
  return validationError(
    `Field '${field}' must be of type '${expectedType}', got '${actualType}'`,
    {
      field,
      value: actualValue,
      constraints: { expectedType, actualType },
      suggestion: `Ensure '${field}' is a ${expectedType}`,
    },
  );
}

export function invalidFormatError(
  field: string,
  format: string,
  value: unknown,
): ValidationError {
  return validationError(
    `Field '${field}' has invalid format: expected ${format}`,
    {
      field,
      value,
      constraints: { format },
      suggestion: `Check the format of '${field}'`,
    },
  );
}

export function fileSystemError(
  operation: FileSystemError['operation'],
  path: string,
  message: string,
  options?: {
    errno?: number;
    cause?: unknown;
    suggestion?: string;
  },
): FileSystemError {
  return {
    category: 'filesystem',
    code: `FS_${operation.toUpperCase()}_ERROR`,
    message,
    path,
    operation,
    errno: options?.errno,
    cause: options?.cause,
    suggestion: options?.suggestion,
    recoverable: operation !== 'read' && operation !== 'stat',
  };
}

export function fileNotFoundError(path: string): FileSystemError {
  return fileSystemError('read', path, `File not found: ${path}`, {
    errno: -2, // ENOENT
    suggestion: 'Check if the file exists and the path is correct',
  });
}

export function directoryNotFoundError(path: string): FileSystemError {
  return fileSystemError('read', path, `Directory not found: ${path}`, {
    errno: -2, // ENOENT
    suggestion: 'Check if the directory exists and the path is correct',
  });
}

export function permissionError(
  operation: FileSystemError['operation'],
  path: string,
): FileSystemError {
  return fileSystemError(
    operation,
    path,
    `Permission denied: cannot ${operation} ${path}`,
    {
      errno: -13, // EACCES
      suggestion: 'Check file permissions or run with appropriate privileges',
    },
  );
}

export function networkError(
  message: string,
  options?: {
    url?: string;
    statusCode?: number;
    timeout?: boolean;
    cause?: unknown;
    suggestion?: string;
  },
): NetworkError {
  return {
    category: 'network',
    code: options?.timeout ? 'NETWORK_TIMEOUT' : 'NETWORK_ERROR',
    message,
    url: options?.url,
    statusCode: options?.statusCode,
    timeout: options?.timeout,
    cause: options?.cause,
    suggestion: options?.suggestion,
    recoverable: true,
  };
}

export function httpError(url: string, statusCode: number): NetworkError {
  const statusMessages: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };

  const message = statusMessages[statusCode] || `HTTP ${statusCode}`;
  return networkError(`${message}: ${url}`, {
    url,
    statusCode,
    suggestion:
      statusCode >= 500
        ? 'The server is experiencing issues. Try again later.'
        : 'Check the URL and request parameters.',
  });
}

export function timeoutError(url: string, timeoutMs: number): NetworkError {
  return networkError(`Request timed out after ${timeoutMs}ms: ${url}`, {
    url,
    timeout: true,
    suggestion: 'Check your network connection or try again later.',
  });
}

export function configurationError(
  message: string,
  options?: {
    configFile?: string;
    missingFields?: string[];
    invalidFields?: string[];
    cause?: unknown;
    suggestion?: string;
  },
): ConfigurationError {
  return {
    category: 'configuration',
    code: 'CONFIG_ERROR',
    message,
    configFile: options?.configFile,
    missingFields: options?.missingFields,
    invalidFields: options?.invalidFields,
    cause: options?.cause,
    suggestion: options?.suggestion,
    recoverable: true,
  };
}

export function missingConfigError(
  configFile: string,
  missingFields: string[],
): ConfigurationError {
  return configurationError(
    `Missing required configuration fields in ${configFile}`,
    {
      configFile,
      missingFields,
      suggestion: `Add the following fields to ${configFile}: ${missingFields.join(', ')}`,
    },
  );
}

export function invalidConfigFieldError(
  fieldPath: string,
  expectedType: string,
  actualValue: unknown,
  exampleValue?: unknown,
): ConfigurationError {
  const actualType = Array.isArray(actualValue)
    ? 'array'
    : actualValue === null
      ? 'null'
      : typeof actualValue;

  let message = `Invalid configuration field '${fieldPath}': expected ${expectedType}, got ${actualType}`;

  if (actualValue !== undefined) {
    message += ` (${JSON.stringify(actualValue)})`;
  }

  let suggestion = `Ensure '${fieldPath}' is a valid ${expectedType}`;

  if (exampleValue !== undefined) {
    suggestion += `. Example: ${JSON.stringify(exampleValue)}`;
  }

  return configurationError(message, {
    invalidFields: [fieldPath],
    suggestion,
  });
}

export function invalidConfigValueError(
  fieldPath: string,
  value: unknown,
  allowedValues: readonly unknown[],
  suggestion?: string,
): ConfigurationError {
  const message = `Invalid value for '${fieldPath}': '${value}' is not one of the allowed values`;

  const defaultSuggestion = `Allowed values for '${fieldPath}' are: ${allowedValues
    .map((v) => JSON.stringify(v))
    .join(', ')}`;

  return configurationError(message, {
    invalidFields: [fieldPath],
    suggestion: suggestion || defaultSuggestion,
  });
}

export function executionError(
  command: string,
  message: string,
  options?: {
    exitCode?: number;
    stdout?: string;
    stderr?: string;
    cause?: unknown;
    suggestion?: string;
  },
): ExecutionError {
  return {
    category: 'execution',
    code: 'EXEC_ERROR',
    message,
    command,
    exitCode: options?.exitCode,
    stdout: options?.stdout,
    stderr: options?.stderr,
    cause: options?.cause,
    suggestion: options?.suggestion,
    recoverable: false,
  };
}

export function commandNotFoundError(command: string): ExecutionError {
  return executionError(command, `Command not found: ${command}`, {
    exitCode: 127,
    suggestion: `Install '${command}' or check your PATH`,
  });
}

export function userInputError(
  message: string,
  options?: {
    input?: string;
    expectedFormat?: string;
    suggestion?: string;
  },
): UserInputError {
  return {
    category: 'user-input',
    code: 'USER_INPUT_ERROR',
    message,
    input: options?.input,
    expectedFormat: options?.expectedFormat,
    suggestion: options?.suggestion,
    recoverable: true,
  };
}

export function invalidInputError(
  input: string,
  expectedFormat: string,
): UserInputError {
  return userInputError(`Invalid input: '${input}'`, {
    input,
    expectedFormat,
    suggestion: `Expected format: ${expectedFormat}`,
  });
}

export function dependencyError(
  message: string,
  options?: {
    packageName?: string;
    requiredVersion?: string;
    installedVersion?: string;
    cause?: unknown;
    suggestion?: string;
  },
): DependencyError {
  return {
    category: 'dependency',
    code: 'DEPENDENCY_ERROR',
    message,
    packageName: options?.packageName,
    requiredVersion: options?.requiredVersion,
    installedVersion: options?.installedVersion,
    cause: options?.cause,
    suggestion: options?.suggestion,
    recoverable: true,
  };
}

export function missingDependencyError(
  packageName: string,
  requiredVersion?: string,
): DependencyError {
  const version = requiredVersion ? ` (version ${requiredVersion})` : '';
  return dependencyError(`Missing dependency: ${packageName}${version}`, {
    packageName,
    requiredVersion,
    suggestion: `Install with: npm install ${packageName}${requiredVersion ? `@${requiredVersion}` : ''}`,
  });
}

/**
 * Add context to an error
 */
export function withContext<E extends CLIError>(
  error: E,
  context: Partial<ErrorContext>,
): E {
  return {
    ...error,
    details: [
      error.details,
      context.operation && `Operation: ${context.operation}`,
      context.component && `Component: ${context.component}`,
    ]
      .filter(Boolean)
      .join('\n'),
  };
}

/**
 * Chain errors together
 */
export function chainError<E extends CLIError>(
  error: E,
  cause: CLIError | Error | unknown,
): E {
  return {
    ...error,
    cause,
  };
}
