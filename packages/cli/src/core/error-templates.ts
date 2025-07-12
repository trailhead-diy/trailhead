import type {
  TrailheadError,
  ValidationError,
  FileSystemError,
  NetworkError,
  ConfigurationError,
  ExecutionError,
  UserInputError,
  DependencyError,
} from '@trailhead/core';
import {
  createValidationError,
  createFileSystemError,
  createNetworkError,
  createDependencyError,
  createConfigurationError,
  createExecutionError,
  createUserInputError,
  createCLIError,
} from '@trailhead/core';

/**
 * Flow Control & Error Handling - addresses GitHub issue #113
 *
 * This module implements standardized error message templates for consistent
 * error UX across the framework with i18n support.
 */

// Error template types for consistent messaging
export interface ErrorTemplate<T extends TrailheadError = TrailheadError> {
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
  fileNotFound: (filePath: string, suggestion?: string): FileSystemError =>
    createFileSystemError('read', filePath, `File not found: ${filePath}`, {
      errno: -2,
      suggestion: suggestion ?? `Check if the file exists and the path is correct: ${filePath}`,
    }),

  directoryNotFound: (dirPath: string): FileSystemError =>
    createFileSystemError('read', dirPath, `Directory not found: ${dirPath}`, {
      errno: -2, // ENOENT
      suggestion: `Create the directory or check the path: ${dirPath}`,
    }),

  fileAlreadyExists: (filePath: string): FileSystemError =>
    createFileSystemError('write', filePath, `File already exists: ${filePath}`, {
      errno: -17, // EEXIST
      suggestion: 'Use --force to overwrite or choose a different filename',
    }),

  permissionDenied: (filePath: string, operation: string): FileSystemError =>
    createFileSystemError(
      operation as any,
      filePath,
      `Permission denied: cannot ${operation} ${filePath}`,
      {
        errno: -13, // EACCES
        suggestion: 'Check file permissions or run with appropriate privileges',
      }
    ),

  diskSpaceFull: (filePath: string): FileSystemError =>
    createFileSystemError('write', filePath, `No space left on device: ${filePath}`, {
      errno: -28, // ENOSPC
      suggestion: 'Free up disk space and try again',
    }),

  // Validation Errors
  requiredFieldMissing: (fieldName: string): ValidationError =>
    createValidationError(`Required field '${fieldName}' is missing`, {
      field: fieldName,
      suggestion: `Provide a value for '${fieldName}'`,
    }),

  invalidFormat: (
    fieldName: string,
    expectedFormat: string,
    actualValue?: unknown
  ): ValidationError =>
    createValidationError(`Field '${fieldName}' has invalid format: expected ${expectedFormat}`, {
      field: fieldName,
      value: actualValue,
      constraints: { expectedFormat },
      suggestion: `Ensure '${fieldName}' matches the ${expectedFormat} format`,
    }),

  valueOutOfRange: (
    fieldName: string,
    min: number | string,
    max: number | string,
    actualValue?: unknown
  ): ValidationError =>
    createValidationError(
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
  ): ValidationError =>
    createValidationError(
      `Field '${fieldName}' has invalid value: must be one of ${validChoices.join(', ')}`,
      {
        field: fieldName,
        value: actualValue,
        constraints: { validChoices },
        suggestion: `Choose one of: ${validChoices.join(', ')}`,
      }
    ),

  // Network Errors
  connectionTimeout: (url: string, timeoutMs: number): NetworkError =>
    createNetworkError(`Connection timeout: ${url}`, {
      url,
      timeout: true,
      statusCode: 408,
      suggestion: `Check your internet connection and try again. Timeout was ${timeoutMs}ms`,
    }),

  connectionRefused: (url: string): NetworkError =>
    createNetworkError(`Connection refused: ${url}`, {
      url,
      statusCode: 0,
      suggestion: 'Check if the server is running and accessible',
    }),

  notFound: (url: string): NetworkError =>
    createNetworkError(`Resource not found: ${url}`, {
      url,
      statusCode: 404,
      suggestion: 'Check the URL and try again',
    }),

  unauthorized: (url: string): NetworkError =>
    createNetworkError(`Unauthorized access: ${url}`, {
      url,
      statusCode: 401,
      suggestion: 'Check your authentication credentials',
    }),

  rateLimited: (url: string, retryAfter?: number): NetworkError =>
    createNetworkError(`Rate limit exceeded: ${url}`, {
      url,
      statusCode: 429,
      suggestion: retryAfter
        ? `Too many requests. Try again in ${retryAfter} seconds`
        : 'Too many requests. Wait a moment and try again',
    }),

  // Configuration Errors
  configFileMissing: (configPath: string): ConfigurationError =>
    createConfigurationError(`Configuration file not found: ${configPath}`, {
      configFile: configPath,
      suggestion: `Create a configuration file at ${configPath} or run with --init`,
    }),

  configFileInvalid: (configPath: string, parseError?: string): ConfigurationError =>
    createConfigurationError(`Invalid configuration file: ${configPath}`, {
      configFile: configPath,
      suggestion: parseError
        ? `Fix the configuration syntax: ${parseError}`
        : 'Check the configuration file syntax and try again',
    }),

  configValueInvalid: (key: string, value: unknown, expectedType: string): ConfigurationError =>
    createConfigurationError(`Invalid configuration value for '${key}': expected ${expectedType}`, {
      invalidFields: [key],
      suggestion: `Set '${key}' to a valid ${expectedType} value`,
    }),

  // Execution Errors
  commandNotFound: (command: string): ExecutionError =>
    createExecutionError(`Command not found: ${command}`, {
      command,
      exitCode: 127,
      suggestion: `Check if '${command}' is installed and available in PATH`,
    }),

  commandFailed: (command: string, exitCode: number, stderr?: string): ExecutionError =>
    createExecutionError(`Command failed: ${command} (exit code ${exitCode})`, {
      command,
      exitCode,
      stderr,
      suggestion: stderr
        ? `Fix the error: ${stderr}`
        : `Command '${command}' failed with exit code ${exitCode}`,
    }),

  processTimeout: (command: string, timeoutMs: number): ExecutionError =>
    createExecutionError(`Process timeout: ${command} (after ${timeoutMs}ms)`, {
      command,
      suggestion: `Increase timeout or check if '${command}' is responding`,
    }),

  // User Input Errors
  invalidInput: (input: string, reason?: string): UserInputError =>
    createUserInputError(`Invalid input: ${input}`, {
      input,
      suggestion: reason ?? 'Provide valid input and try again',
    }),

  missingArgument: (argument: string): UserInputError =>
    createUserInputError(`Missing required argument: ${argument}`, {
      suggestion: `Provide the required argument: ${argument}`,
    }),

  tooManyArguments: (expected: number, actual: number): UserInputError =>
    createUserInputError(`Too many arguments: expected ${expected}, got ${actual}`, {
      expectedFormat: `${expected} argument${expected === 1 ? '' : 's'}`,
      suggestion: `Provide exactly ${expected} argument${expected === 1 ? '' : 's'}`,
    }),

  // Dependency Errors
  packageNotInstalled: (packageName: string, installCommand?: string): DependencyError =>
    createDependencyError(`Package not installed: ${packageName}`, {
      packageName,
      suggestion: installCommand
        ? `Install the package: ${installCommand}`
        : `Install the package '${packageName}' and try again`,
    }),

  versionMismatch: (
    packageName: string,
    requiredVersion: string,
    actualVersion: string
  ): DependencyError =>
    createDependencyError(
      `Version mismatch for ${packageName}: required ${requiredVersion}, found ${actualVersion}`,
      {
        packageName,
        requiredVersion,
        installedVersion: actualVersion,
        suggestion: `Update '${packageName}' to version ${requiredVersion} or higher`,
      }
    ),

  dependencyConflict: (package1: string, package2: string, reason?: string): DependencyError =>
    createDependencyError(`Dependency conflict between ${package1} and ${package2}`, {
      packageName: package1,
      suggestion: reason ?? 'Resolve the dependency conflict and try again',
    }),

  // Operation Errors
  operationCancelled: (operationName: string): TrailheadError =>
    createCLIError(`Operation cancelled: ${operationName}`, {
      suggestion: 'Restart the operation if needed',
    }),

  operationTimeout: (operationName: string, timeoutMs: number): TrailheadError =>
    createCLIError(`Operation timed out: ${operationName} (after ${timeoutMs}ms)`, {
      suggestion: `Increase timeout or check if '${operationName}' is responding`,
      context: { timeout: timeoutMs },
    }),

  operationFailed: (operationName: string, reason: string): TrailheadError =>
    createCLIError(`Operation failed: ${operationName}`, {
      suggestion: `Fix the issue and retry: ${reason}`,
      context: { reason },
    }),

  // Parse Errors
  parseFailure: (format: string, filePath?: string, parseError?: string): TrailheadError =>
    createCLIError(`Failed to parse ${format}${filePath ? `: ${filePath}` : ''}`, {
      suggestion: parseError
        ? `Fix the ${format} syntax: ${parseError}`
        : `Check the ${format} format and try again`,
    }),

  // Format Errors
  unsupportedFormat: (format: string, supportedFormats: string[]): TrailheadError =>
    createCLIError(`Unsupported format: ${format}`, {
      suggestion: `Use one of the supported formats: ${supportedFormats.join(', ')}`,
      context: { format, supportedFormats },
    }),

  // Authentication Errors
  authenticationFailed: (service?: string): TrailheadError =>
    createCLIError(`Authentication failed${service ? ` for ${service}` : ''}`, {
      suggestion: 'Check your credentials and try again',
    }),

  authenticationExpired: (service?: string): TrailheadError =>
    createCLIError(`Authentication expired${service ? ` for ${service}` : ''}`, {
      suggestion: 'Re-authenticate and try again',
    }),
} as const;

/**
 * Create custom error templates with consistent patterns
 */
export function createCLIErrorTemplate<T extends TrailheadError>(
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
  register<T extends TrailheadError>(
    name: string,
    template: ErrorTemplate<T>
  ): ErrorTemplateRegistry;
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
    register<T extends TrailheadError>(
      name: string,
      template: ErrorTemplate<T>
    ): ErrorTemplateRegistry {
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
