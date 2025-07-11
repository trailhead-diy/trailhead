import type {
  TrailheadError,
  ValidationError,
  FileSystemError,
  NetworkError,
  ConfigurationError,
  ExecutionError,
  UserInputError,
  DependencyError,
  DataError,
  GitError,
  CLIError,
  DatabaseError,
  ErrorContext,
  ErrorSeverity,
  SeverityError,
} from './types.js';

/**
 * Base error factory function
 */
export const createTrailheadError = (
  type: string,
  message: string,
  options?: {
    details?: string;
    cause?: unknown;
    suggestion?: string;
    recoverable?: boolean;
    context?: Record<string, unknown>;
  }
): TrailheadError => ({
  type,
  message,
  details: options?.details,
  cause: options?.cause,
  suggestion: options?.suggestion,
  recoverable: options?.recoverable ?? false,
  context: options?.context,
});

/**
 * Add severity to any error
 */
export const createSeverityError = (
  error: TrailheadError,
  severity: ErrorSeverity
): SeverityError => ({
  ...error,
  severity,
});

// Validation Errors
export const createValidationError = (
  message: string,
  options?: {
    field?: string;
    value?: unknown;
    constraints?: Record<string, unknown>;
    suggestion?: string;
    context?: Record<string, unknown>;
  }
): ValidationError => ({
  type: 'VALIDATION_ERROR',
  category: 'validation',
  message,
  field: options?.field,
  value: options?.value,
  constraints: options?.constraints,
  suggestion: options?.suggestion,
  recoverable: true,
  context: options?.context,
});

export const createRequiredFieldError = (field: string): ValidationError =>
  createValidationError(`Required field '${field}' is missing`, {
    field,
    suggestion: `Provide a value for '${field}'`,
  });

export const createInvalidTypeError = (
  field: string,
  expectedType: string,
  actualValue: unknown
): ValidationError => {
  const actualType = Array.isArray(actualValue) ? 'array' : typeof actualValue;
  return createValidationError(
    `Field '${field}' must be of type '${expectedType}', got '${actualType}'`,
    {
      field,
      value: actualValue,
      constraints: { expectedType, actualType },
      suggestion: `Ensure '${field}' is a ${expectedType}`,
    }
  );
};

// File System Errors
export const createFileSystemError = (
  operation: FileSystemError['operation'],
  path: string,
  message: string,
  options?: {
    errno?: number;
    cause?: unknown;
    suggestion?: string;
    context?: Record<string, unknown>;
  }
): FileSystemError => ({
  type: `FS_${operation.toUpperCase()}_ERROR`,
  category: 'filesystem',
  message,
  path,
  operation,
  errno: options?.errno,
  cause: options?.cause,
  suggestion: options?.suggestion,
  recoverable: operation !== 'read' && operation !== 'stat',
  context: options?.context,
});

export const createFileNotFoundError = (path: string): FileSystemError =>
  createFileSystemError('read', path, `File not found: ${path}`, {
    errno: -2, // ENOENT
    suggestion: 'Check if the file exists and the path is correct',
  });

export const createDirectoryNotFoundError = (path: string): FileSystemError =>
  createFileSystemError('read', path, `Directory not found: ${path}`, {
    errno: -2, // ENOENT
    suggestion: 'Check if the directory exists and the path is correct',
  });

export const createPermissionError = (
  operation: FileSystemError['operation'],
  path: string
): FileSystemError =>
  createFileSystemError(operation, path, `Permission denied: cannot ${operation} ${path}`, {
    errno: -13, // EACCES
    suggestion: 'Check file permissions or run with appropriate privileges',
  });

// Network Errors
export const createNetworkError = (
  message: string,
  options?: {
    url?: string;
    statusCode?: number;
    timeout?: boolean;
    cause?: unknown;
    suggestion?: string;
    context?: Record<string, unknown>;
  }
): NetworkError => ({
  type: options?.timeout ? 'NETWORK_TIMEOUT' : 'NETWORK_ERROR',
  category: 'network',
  message,
  url: options?.url,
  statusCode: options?.statusCode,
  timeout: options?.timeout,
  cause: options?.cause,
  suggestion: options?.suggestion,
  recoverable: true,
  context: options?.context,
});

export const createHttpError = (url: string, statusCode: number): NetworkError => {
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
  return createNetworkError(`${message}: ${url}`, {
    url,
    statusCode,
    suggestion:
      statusCode >= 500
        ? 'The server is experiencing issues. Try again later.'
        : 'Check the URL and request parameters.',
  });
};

// Configuration Errors
export const createConfigurationError = (
  message: string,
  options?: {
    configFile?: string;
    missingFields?: string[];
    invalidFields?: string[];
    cause?: unknown;
    suggestion?: string;
    context?: Record<string, unknown>;
  }
): ConfigurationError => ({
  type: 'CONFIG_ERROR',
  category: 'configuration',
  message,
  configFile: options?.configFile,
  missingFields: options?.missingFields,
  invalidFields: options?.invalidFields,
  cause: options?.cause,
  suggestion: options?.suggestion,
  recoverable: true,
  context: options?.context,
});

// Data Errors
export const createDataError = (
  message: string,
  options?: {
    format?: DataError['format'];
    row?: number;
    column?: string;
    cause?: unknown;
    suggestion?: string;
    context?: Record<string, unknown>;
  }
): DataError => ({
  type: 'DATA_ERROR',
  category: 'data',
  message,
  format: options?.format,
  row: options?.row,
  column: options?.column,
  cause: options?.cause,
  suggestion: options?.suggestion,
  recoverable: true,
  context: options?.context,
});

// Git Errors
export const createGitError = (
  message: string,
  options?: {
    repository?: string;
    branch?: string;
    operation?: string;
    cause?: unknown;
    suggestion?: string;
    context?: Record<string, unknown>;
  }
): GitError => ({
  type: 'GIT_ERROR',
  category: 'git',
  message,
  repository: options?.repository,
  branch: options?.branch,
  operation: options?.operation,
  cause: options?.cause,
  suggestion: options?.suggestion,
  recoverable: true,
  context: options?.context,
});

// CLI Errors
export const createCLIError = (
  message: string,
  options?: {
    command?: string;
    args?: string[];
    cause?: unknown;
    suggestion?: string;
    context?: Record<string, unknown>;
  }
): CLIError => ({
  type: 'CLI_ERROR',
  category: 'cli',
  message,
  command: options?.command,
  args: options?.args,
  cause: options?.cause,
  suggestion: options?.suggestion,
  recoverable: true,
  context: options?.context,
});

// Database Errors
export const createDatabaseError = (
  message: string,
  options?: {
    query?: string;
    table?: string;
    operation?: DatabaseError['operation'];
    cause?: unknown;
    suggestion?: string;
    context?: Record<string, unknown>;
  }
): DatabaseError => ({
  type: 'DATABASE_ERROR',
  category: 'db',
  message,
  query: options?.query,
  table: options?.table,
  operation: options?.operation,
  cause: options?.cause,
  suggestion: options?.suggestion,
  recoverable: options?.operation !== 'migrate',
  context: options?.context,
});

/**
 * Add context to any error
 */
export const withContext = <E extends TrailheadError>(
  error: E,
  context: Partial<ErrorContext>
): E => ({
  ...error,
  details: [
    error.details,
    context.operation && `Operation: ${context.operation}`,
    context.component && `Component: ${context.component}`,
  ]
    .filter(Boolean)
    .join('\n'),
  context: {
    ...error.context,
    ...context,
  },
});

/**
 * Chain errors together
 */
export const chainError = <E extends TrailheadError>(
  error: E,
  cause: TrailheadError | Error | unknown
): E => ({
  ...error,
  cause,
});
