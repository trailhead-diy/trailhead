import type { CoreError } from '@trailhead/core';
import { createCoreError } from '@trailhead/core';

/**
 * Flow Control & Error Handling - addresses GitHub issue #113
 *
 * This module implements standardized error message templates for consistent
 * error UX across the framework with i18n support.
 */

// Domain-specific error types extending CoreError
export interface CLIFileSystemError extends CoreError {
  readonly path: string;
  readonly operation: 'read' | 'write' | 'delete' | 'create' | 'copy' | 'move' | 'stat' | 'watch';
  readonly errno?: number;
}

export interface CLIValidationError extends CoreError {
  readonly field?: string;
  readonly value?: unknown;
  readonly constraints?: Record<string, unknown>;
}

export interface CLINetworkError extends CoreError {
  readonly url?: string;
  readonly statusCode?: number;
  readonly timeout?: boolean;
}

export interface CLIConfigurationError extends CoreError {
  readonly configFile?: string;
  readonly missingFields?: string[];
  readonly invalidFields?: string[];
}

export interface CLIExecutionError extends CoreError {
  readonly command?: string;
  readonly exitCode?: number;
  readonly stdout?: string;
  readonly stderr?: string;
}

export interface CLIUserInputError extends CoreError {
  readonly input?: string;
  readonly expectedFormat?: string;
}

export interface CLIDependencyError extends CoreError {
  readonly packageName?: string;
  readonly requiredVersion?: string;
  readonly installedVersion?: string;
}

// Domain error factories
const createCLIFileSystemError = (
  operation: CLIFileSystemError['operation'],
  path: string,
  message: string,
  options?: {
    errno?: number;
    cause?: unknown;
    suggestion?: string;
    context?: Record<string, unknown>;
  }
): CLIFileSystemError => ({
  ...createCoreError(`FS_${operation.toUpperCase()}_ERROR`, message, {
    suggestion: options?.suggestion,
    recoverable: operation !== 'read' && operation !== 'stat',
    cause: options?.cause,
    context: options?.context,
  }),
  path,
  operation,
  errno: options?.errno,
});

const createCLIValidationError = (
  message: string,
  options?: {
    field?: string;
    value?: unknown;
    constraints?: Record<string, unknown>;
    suggestion?: string;
    context?: Record<string, unknown>;
  }
): CLIValidationError => ({
  ...createCoreError('VALIDATION_ERROR', message, {
    suggestion: options?.suggestion,
    recoverable: true,
    context: options?.context,
  }),
  field: options?.field,
  value: options?.value,
  constraints: options?.constraints,
});

const createCLINetworkError = (
  message: string,
  options?: {
    url?: string;
    statusCode?: number;
    timeout?: boolean;
    cause?: unknown;
    suggestion?: string;
    context?: Record<string, unknown>;
  }
): CLINetworkError => ({
  ...createCoreError(options?.timeout ? 'NETWORK_TIMEOUT' : 'NETWORK_ERROR', message, {
    suggestion: options?.suggestion,
    recoverable: true,
    cause: options?.cause,
    context: options?.context,
  }),
  url: options?.url,
  statusCode: options?.statusCode,
  timeout: options?.timeout,
});

const createCLIConfigurationError = (
  message: string,
  options?: {
    configFile?: string;
    missingFields?: string[];
    invalidFields?: string[];
    cause?: unknown;
    suggestion?: string;
    context?: Record<string, unknown>;
  }
): CLIConfigurationError => ({
  ...createCoreError('CONFIG_ERROR', message, {
    suggestion: options?.suggestion,
    recoverable: true,
    cause: options?.cause,
    context: options?.context,
  }),
  configFile: options?.configFile,
  missingFields: options?.missingFields,
  invalidFields: options?.invalidFields,
});

const createCLIExecutionError = (
  message: string,
  options?: {
    command?: string;
    exitCode?: number;
    stdout?: string;
    stderr?: string;
    cause?: unknown;
    suggestion?: string;
    context?: Record<string, unknown>;
  }
): CLIExecutionError => ({
  ...createCoreError('EXECUTION_ERROR', message, {
    suggestion: options?.suggestion,
    recoverable: false,
    cause: options?.cause,
    context: options?.context,
  }),
  command: options?.command,
  exitCode: options?.exitCode,
  stdout: options?.stdout,
  stderr: options?.stderr,
});

const createCLIUserInputError = (
  message: string,
  options?: {
    input?: string;
    expectedFormat?: string;
    cause?: unknown;
    suggestion?: string;
    context?: Record<string, unknown>;
  }
): CLIUserInputError => ({
  ...createCoreError('USER_INPUT_ERROR', message, {
    suggestion: options?.suggestion,
    recoverable: true,
    cause: options?.cause,
    context: options?.context,
  }),
  input: options?.input,
  expectedFormat: options?.expectedFormat,
});

const createCLIDependencyError = (
  message: string,
  options?: {
    packageName?: string;
    requiredVersion?: string;
    installedVersion?: string;
    cause?: unknown;
    suggestion?: string;
    context?: Record<string, unknown>;
  }
): CLIDependencyError => ({
  ...createCoreError('DEPENDENCY_ERROR', message, {
    suggestion: options?.suggestion,
    recoverable: true,
    cause: options?.cause,
    context: options?.context,
  }),
  packageName: options?.packageName,
  requiredVersion: options?.requiredVersion,
  installedVersion: options?.installedVersion,
});

const createCLIError = (
  message: string,
  options?: {
    code?: string;
    command?: string;
    args?: string[];
    cause?: unknown;
    suggestion?: string;
    context?: Record<string, unknown>;
  }
): CoreError =>
  createCoreError('CLI_ERROR', message, {
    suggestion: options?.suggestion,
    recoverable: true,
    cause: options?.cause,
    context: {
      ...options?.context,
      code: options?.code,
      command: options?.command,
      args: options?.args,
    },
  });

// Error template types for consistent messaging
export interface ErrorTemplate<T extends CoreError = CoreError> {
  create: (...args: any[]) => T;
  code: string;
  category: string;
}

/**
 * Standard error templates for common scenarios
 * Provides consistent error messages and UX across the framework
 */
export const errorTemplates = {
  // File System Errors
  fileNotFound: (filePath: string, suggestion?: string): CLIFileSystemError =>
    createCLIFileSystemError('read', filePath, `File not found: ${filePath}`, {
      errno: -2,
      suggestion: suggestion ?? `Check if the file exists and the path is correct: ${filePath}`,
    }),

  directoryNotFound: (dirPath: string): CLIFileSystemError =>
    createCLIFileSystemError('read', dirPath, `Directory not found: ${dirPath}`, {
      errno: -2, // ENOENT
      suggestion: `Create the directory or check the path: ${dirPath}`,
    }),

  fileAlreadyExists: (filePath: string): CLIFileSystemError =>
    createCLIFileSystemError('write', filePath, `File already exists: ${filePath}`, {
      errno: -17, // EEXIST
      suggestion: 'Use --force to overwrite or choose a different filename',
    }),

  permissionDenied: (filePath: string, operation: string): CLIFileSystemError =>
    createCLIFileSystemError(
      operation as any,
      filePath,
      `Permission denied: cannot ${operation} ${filePath}`,
      {
        errno: -13, // EACCES
        suggestion: 'Check file permissions or run with appropriate privileges',
      }
    ),

  diskSpaceFull: (filePath: string): CLIFileSystemError =>
    createCLIFileSystemError('write', filePath, `No space left on device: ${filePath}`, {
      errno: -28, // ENOSPC
      suggestion: 'Free up disk space and try again',
    }),

  // Validation Errors
  requiredFieldMissing: (fieldName: string): CLIValidationError =>
    createCLIValidationError(`Required field '${fieldName}' is missing`, {
      field: fieldName,
      suggestion: `Provide a value for '${fieldName}'`,
    }),

  invalidFormat: (
    fieldName: string,
    expectedFormat: string,
    actualValue?: unknown
  ): CLIValidationError =>
    createCLIValidationError(
      `Field '${fieldName}' has invalid format: expected ${expectedFormat}`,
      {
        field: fieldName,
        value: actualValue,
        constraints: { expectedFormat },
        suggestion: `Ensure '${fieldName}' matches the ${expectedFormat} format`,
      }
    ),

  valueOutOfRange: (
    fieldName: string,
    min: number | string,
    max: number | string,
    actualValue?: unknown
  ): CLIValidationError =>
    createCLIValidationError(
      `Field '${fieldName}' is out of range: must be between ${min} and ${max}`,
      {
        field: fieldName,
        value: actualValue,
        constraints: { min, max },
        suggestion: `Provide a value for '${fieldName}' between ${min} and ${max}`,
      }
    ),

  invalidChoice: (
    fieldName: string,
    validChoices: string[],
    actualValue?: unknown
  ): CLIValidationError =>
    createCLIValidationError(
      `Field '${fieldName}' has invalid value: must be one of ${validChoices.join(', ')}`,
      {
        field: fieldName,
        value: actualValue,
        constraints: { validChoices },
        suggestion: `Choose one of: ${validChoices.join(', ')}`,
      }
    ),

  // Network Errors
  connectionTimeout: (url: string, timeoutMs: number): CLINetworkError =>
    createCLINetworkError(`Connection timeout: ${url}`, {
      url,
      timeout: true,
      statusCode: 408,
      suggestion: `Check your internet connection and try again. Timeout was ${timeoutMs}ms`,
    }),

  connectionRefused: (url: string): CLINetworkError =>
    createCLINetworkError(`Connection refused: ${url}`, {
      url,
      statusCode: 0,
      suggestion: 'Check if the server is running and accessible',
    }),

  notFound: (url: string): CLINetworkError =>
    createCLINetworkError(`Resource not found: ${url}`, {
      url,
      statusCode: 404,
      suggestion: 'Check the URL and try again',
    }),

  unauthorized: (url: string): CLINetworkError =>
    createCLINetworkError(`Unauthorized access: ${url}`, {
      url,
      statusCode: 401,
      suggestion: 'Check your authentication credentials',
    }),

  rateLimited: (url: string, retryAfter?: number): CLINetworkError =>
    createCLINetworkError(`Rate limit exceeded: ${url}`, {
      url,
      statusCode: 429,
      suggestion: retryAfter
        ? `Too many requests. Try again in ${retryAfter} seconds`
        : 'Too many requests. Wait a moment and try again',
    }),

  // Configuration Errors
  configFileMissing: (configPath: string): CLIConfigurationError =>
    createCLIConfigurationError(`Configuration file not found: ${configPath}`, {
      configFile: configPath,
      suggestion: `Create a configuration file at ${configPath} or run with --init`,
    }),

  configFileInvalid: (configPath: string, parseError?: string): CLIConfigurationError =>
    createCLIConfigurationError(`Invalid configuration file: ${configPath}`, {
      configFile: configPath,
      suggestion: parseError
        ? `Fix the configuration syntax: ${parseError}`
        : 'Check the configuration file syntax and try again',
    }),

  configValueInvalid: (key: string, value: unknown, expectedType: string): CLIConfigurationError =>
    createCLIConfigurationError(
      `Invalid configuration value for '${key}': expected ${expectedType}`,
      {
        invalidFields: [key],
        suggestion: `Set '${key}' to a valid ${expectedType} value`,
      }
    ),

  // Execution Errors
  commandNotFound: (command: string): CLIExecutionError =>
    createCLIExecutionError(`Command not found: ${command}`, {
      command,
      exitCode: 127,
      suggestion: `Check if '${command}' is installed and available in PATH`,
    }),

  commandFailed: (command: string, exitCode: number, stderr?: string): CLIExecutionError =>
    createCLIExecutionError(`Command failed: ${command} (exit code ${exitCode})`, {
      command,
      exitCode,
      stderr,
      suggestion: stderr
        ? `Fix the error: ${stderr}`
        : `Command '${command}' failed with exit code ${exitCode}`,
    }),

  processTimeout: (command: string, timeoutMs: number): CLIExecutionError =>
    createCLIExecutionError(`Process timeout: ${command} (after ${timeoutMs}ms)`, {
      command,
      suggestion: `Increase timeout or check if '${command}' is responding`,
    }),

  // User Input Errors
  invalidInput: (input: string, reason?: string): CLIUserInputError =>
    createCLIUserInputError(`Invalid input: ${input}`, {
      input,
      suggestion: reason ?? 'Provide valid input and try again',
    }),

  missingArgument: (argument: string): CLIUserInputError =>
    createCLIUserInputError(`Missing required argument: ${argument}`, {
      suggestion: `Provide the required argument: ${argument}`,
    }),

  tooManyArguments: (expected: number, actual: number): CLIUserInputError =>
    createCLIUserInputError(`Too many arguments: expected ${expected}, got ${actual}`, {
      expectedFormat: `${expected} argument${expected === 1 ? '' : 's'}`,
      suggestion: `Provide exactly ${expected} argument${expected === 1 ? '' : 's'}`,
    }),

  // Dependency Errors
  packageNotInstalled: (packageName: string, installCommand?: string): CLIDependencyError =>
    createCLIDependencyError(`Package not installed: ${packageName}`, {
      packageName,
      suggestion: installCommand
        ? `Install the package: ${installCommand}`
        : `Install the package '${packageName}' and try again`,
    }),

  versionMismatch: (
    packageName: string,
    requiredVersion: string,
    actualVersion: string
  ): CLIDependencyError =>
    createCLIDependencyError(
      `Version mismatch for ${packageName}: required ${requiredVersion}, found ${actualVersion}`,
      {
        packageName,
        requiredVersion,
        installedVersion: actualVersion,
        suggestion: `Update '${packageName}' to version ${requiredVersion} or higher`,
      }
    ),

  dependencyConflict: (package1: string, package2: string, reason?: string): CLIDependencyError =>
    createCLIDependencyError(`Dependency conflict between ${package1} and ${package2}`, {
      packageName: package1,
      suggestion: reason ?? 'Resolve the dependency conflict and try again',
    }),

  // Operation Errors
  operationCancelled: (operationName: string): CoreError =>
    createCLIError(`Operation cancelled: ${operationName}`, {
      suggestion: 'Restart the operation if needed',
    }),

  operationTimeout: (operationName: string, timeoutMs: number): CoreError =>
    createCLIError(`Operation timed out: ${operationName} (after ${timeoutMs}ms)`, {
      suggestion: `Increase timeout or check if '${operationName}' is responding`,
      context: { timeout: timeoutMs },
    }),

  operationFailed: (operationName: string, reason: string): CoreError =>
    createCLIError(`Operation failed: ${operationName}`, {
      suggestion: `Fix the issue and retry: ${reason}`,
      context: { reason },
    }),

  // Parse Errors
  parseFailure: (format: string, filePath?: string, parseError?: string): CoreError =>
    createCLIError(`Failed to parse ${format}${filePath ? `: ${filePath}` : ''}`, {
      suggestion: parseError
        ? `Fix the ${format} syntax: ${parseError}`
        : `Check the ${format} format and try again`,
    }),

  // Format Errors
  unsupportedFormat: (format: string, supportedFormats: string[]): CoreError =>
    createCLIError(`Unsupported format: ${format}`, {
      suggestion: `Use one of the supported formats: ${supportedFormats.join(', ')}`,
      context: { format, supportedFormats },
    }),

  // Authentication Errors
  authenticationFailed: (service?: string): CoreError =>
    createCLIError(`Authentication failed${service ? ` for ${service}` : ''}`, {
      suggestion: 'Check your credentials and try again',
    }),

  authenticationExpired: (service?: string): CoreError =>
    createCLIError(`Authentication expired${service ? ` for ${service}` : ''}`, {
      suggestion: 'Re-authenticate and try again',
    }),
} as const;

/**
 * Create custom error templates with consistent patterns
 */
export function createCLIErrorTemplate<T extends CoreError>(
  code: string,
  category: string,
  messageTemplate: string,
  factory: (...args: any[]) => T
): ErrorTemplate<T> {
  return {
    create: factory,
    code,
    category,
  };
}

/**
 * Error template registry state (immutable)
 */
export interface ErrorTemplateRegistryState {
  readonly templates: ReadonlyMap<string, ErrorTemplate>;
}

/**
 * Error template registry interface (functional)
 */
export interface ErrorTemplateRegistry {
  register<T extends CoreError>(name: string, template: ErrorTemplate<T>): ErrorTemplateRegistry;
  get(name: string): ErrorTemplate | undefined;
  has(name: string): boolean;
  list(): readonly string[];
  clear(): ErrorTemplateRegistry;
  getState(): ErrorTemplateRegistryState;
}

/**
 * Create a functional error template registry
 */
export function createCLIErrorTemplateRegistry(
  state: ErrorTemplateRegistryState = { templates: new Map() }
): ErrorTemplateRegistry {
  return {
    register<T extends CoreError>(name: string, template: ErrorTemplate<T>): ErrorTemplateRegistry {
      const newTemplates = new Map(state.templates);
      newTemplates.set(name, template);
      return createCLIErrorTemplateRegistry({ templates: newTemplates });
    },

    get(name: string): ErrorTemplate | undefined {
      return state.templates.get(name);
    },

    has(name: string): boolean {
      return state.templates.has(name);
    },

    list(): readonly string[] {
      return Array.from(state.templates.keys());
    },

    clear(): ErrorTemplateRegistry {
      return createCLIErrorTemplateRegistry({ templates: new Map() });
    },

    getState(): ErrorTemplateRegistryState {
      return state;
    },
  };
}

/**
 * Global error template registry instance
 */
export const globalErrorTemplates = createCLIErrorTemplateRegistry();

/**
 * Helper function to create errors with consistent formatting
 */
export const errors = errorTemplates;
