import type {
  CLIError,
  ValidationError,
  FileSystemError,
  NetworkError,
  ConfigurationError,
  ExecutionError,
  UserInputError,
  DependencyError,
} from './errors/types.js';
import {
  validationError,
  fileSystemError,
  networkError,
  dependencyError,
  createError,
} from './errors/factory.js';

/**
 * Flow Control & Error Handling - addresses GitHub issue #113
 *
 * This module implements standardized error message templates for consistent
 * error UX across the framework with i18n support.
 */

// Error template types for consistent messaging
export interface ErrorTemplate<T extends CLIError = CLIError> {
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
    ({
      category: 'filesystem',
      code: 'FILESYSTEM_ERROR',
      message: `File not found: ${filePath}`,
      path: filePath,
      operation: 'read',
      errno: -2,
      suggestion: suggestion ?? `Check if the file exists and the path is correct: ${filePath}`,
      recoverable: false,
    }) as FileSystemError,

  directoryNotFound: (dirPath: string): FileSystemError =>
    fileSystemError('read', dirPath, `Directory not found: ${dirPath}`, {
      errno: -2, // ENOENT
      suggestion: `Create the directory or check the path: ${dirPath}`,
    }),

  fileAlreadyExists: (filePath: string): FileSystemError =>
    fileSystemError('write', filePath, `File already exists: ${filePath}`, {
      errno: -17, // EEXIST
      suggestion: 'Use --force to overwrite or choose a different filename',
    }),

  permissionDenied: (filePath: string, operation: string): FileSystemError =>
    fileSystemError(
      operation as any,
      filePath,
      `Permission denied: cannot ${operation} ${filePath}`,
      {
        errno: -13, // EACCES
        suggestion: 'Check file permissions or run with appropriate privileges',
      }
    ),

  diskSpaceFull: (filePath: string): FileSystemError =>
    fileSystemError('write', filePath, `No space left on device: ${filePath}`, {
      errno: -28, // ENOSPC
      suggestion: 'Free up disk space and try again',
    }),

  // Validation Errors
  requiredFieldMissing: (fieldName: string): ValidationError =>
    validationError(`Required field '${fieldName}' is missing`, {
      field: fieldName,
      suggestion: `Provide a value for '${fieldName}'`,
    }),

  invalidFormat: (
    fieldName: string,
    expectedFormat: string,
    actualValue?: unknown
  ): ValidationError =>
    validationError(`Field '${fieldName}' has invalid format: expected ${expectedFormat}`, {
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
    validationError(`Field '${fieldName}' is out of range: must be between ${min} and ${max}`, {
      field: fieldName,
      value: actualValue,
      constraints: { min, max },
      suggestion: `Provide a value for '${fieldName}' between ${min} and ${max}`,
    }),

  invalidChoice: (
    fieldName: string,
    validChoices: string[],
    actualValue?: unknown
  ): ValidationError =>
    validationError(
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
    networkError(`Connection timeout: ${url}`, {
      url,
      timeout: true,
      statusCode: 408,
      suggestion: `Check your internet connection and try again. Timeout was ${timeoutMs}ms`,
    }),

  connectionRefused: (url: string): NetworkError =>
    networkError(`Connection refused: ${url}`, {
      url,
      statusCode: 0,
      suggestion: 'Check if the server is running and accessible',
    }),

  notFound: (url: string): NetworkError =>
    networkError(`Resource not found: ${url}`, {
      url,
      statusCode: 404,
      suggestion: 'Check the URL and try again',
    }),

  unauthorized: (url: string): NetworkError =>
    networkError(`Unauthorized access: ${url}`, {
      url,
      statusCode: 401,
      suggestion: 'Check your authentication credentials',
    }),

  rateLimited: (url: string, retryAfter?: number): NetworkError =>
    networkError(`Rate limit exceeded: ${url}`, {
      url,
      statusCode: 429,
      suggestion: retryAfter
        ? `Too many requests. Try again in ${retryAfter} seconds`
        : 'Too many requests. Wait a moment and try again',
    }),

  // Configuration Errors
  configFileMissing: (configPath: string): ConfigurationError =>
    ({
      category: 'configuration',
      code: 'CONFIGURATION_ERROR',
      message: `Configuration file not found: ${configPath}`,
      configFile: configPath,
      configPath,
      suggestion: `Create a configuration file at ${configPath} or run with --init`,
      recoverable: true,
    }) as ConfigurationError & { configPath: string },

  configFileInvalid: (configPath: string, parseError?: string): ConfigurationError =>
    ({
      category: 'configuration',
      code: 'CONFIGURATION_ERROR',
      message: `Invalid configuration file: ${configPath}`,
      configFile: configPath,
      parseError,
      suggestion: parseError
        ? `Fix the configuration syntax: ${parseError}`
        : 'Check the configuration file syntax and try again',
      recoverable: true,
    }) as ConfigurationError & { parseError?: string },

  configValueInvalid: (key: string, value: unknown, expectedType: string): ConfigurationError =>
    ({
      category: 'configuration',
      code: 'CONFIGURATION_ERROR',
      message: `Invalid configuration value for '${key}': expected ${expectedType}`,
      configFile: undefined,
      invalidFields: [key],
      configKey: key,
      configValue: value,
      expectedType,
      suggestion: `Set '${key}' to a valid ${expectedType} value`,
      recoverable: true,
    }) as ConfigurationError & { configKey: string; configValue: unknown; expectedType: string },

  // Execution Errors
  commandNotFound: (command: string): ExecutionError =>
    ({
      category: 'execution',
      code: 'EXECUTION_ERROR',
      message: `Command not found: ${command}`,
      command,
      exitCode: 127,
      suggestion: `Check if '${command}' is installed and available in PATH`,
      recoverable: false,
    }) as ExecutionError,

  commandFailed: (command: string, exitCode: number, stderr?: string): ExecutionError =>
    ({
      category: 'execution',
      code: 'EXECUTION_ERROR',
      message: `Command failed: ${command} (exit code ${exitCode})`,
      command,
      exitCode,
      stderr,
      suggestion: stderr
        ? `Fix the error: ${stderr}`
        : `Command '${command}' failed with exit code ${exitCode}`,
      recoverable: false,
    }) as ExecutionError,

  processTimeout: (command: string, timeoutMs: number): ExecutionError =>
    ({
      category: 'execution',
      code: 'EXECUTION_ERROR',
      message: `Process timeout: ${command} (after ${timeoutMs}ms)`,
      command,
      timeout: timeoutMs,
      suggestion: `Increase timeout or check if '${command}' is responding`,
      recoverable: false,
    }) as ExecutionError & { timeout: number },

  // User Input Errors
  invalidInput: (input: string, reason?: string): UserInputError =>
    ({
      category: 'user_input' as 'user-input',
      code: 'USER_INPUT_ERROR',
      message: `Invalid input: ${input}`,
      input,
      reason,
      suggestion: reason ?? 'Provide valid input and try again',
      recoverable: true,
    }) as UserInputError & { reason?: string },

  missingArgument: (argument: string): UserInputError =>
    ({
      category: 'user_input' as 'user-input',
      code: 'USER_INPUT_ERROR',
      message: `Missing required argument: ${argument}`,
      input: undefined,
      argument,
      suggestion: `Provide the required argument: ${argument}`,
      recoverable: true,
    }) as UserInputError & { argument: string },

  tooManyArguments: (expected: number, actual: number): UserInputError =>
    ({
      category: 'user_input' as 'user-input',
      code: 'USER_INPUT_ERROR',
      message: `Too many arguments: expected ${expected}, got ${actual}`,
      input: undefined,
      expectedFormat: `${expected} argument${expected === 1 ? '' : 's'}`,
      expected,
      actual,
      suggestion: `Provide exactly ${expected} argument${expected === 1 ? '' : 's'}`,
      recoverable: true,
    }) as UserInputError & { expected: number; actual: number },

  // Dependency Errors
  packageNotInstalled: (packageName: string, installCommand?: string): DependencyError =>
    dependencyError(`Package not installed: ${packageName}`, {
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
    ({
      category: 'dependency',
      code: 'DEPENDENCY_ERROR',
      message: `Version mismatch for ${packageName}: required ${requiredVersion}, found ${actualVersion}`,
      packageName,
      requiredVersion,
      installedVersion: actualVersion,
      actualVersion,
      suggestion: `Update '${packageName}' to version ${requiredVersion} or higher`,
      recoverable: true,
    }) as DependencyError & { actualVersion: string },

  dependencyConflict: (package1: string, package2: string, reason?: string): DependencyError =>
    ({
      category: 'dependency',
      code: 'DEPENDENCY_ERROR',
      message: `Dependency conflict between ${package1} and ${package2}`,
      packageName: package1,
      conflictingPackages: [package1, package2],
      reason,
      suggestion: reason ?? 'Resolve the dependency conflict and try again',
      recoverable: true,
    }) as DependencyError & { conflictingPackages: string[]; reason?: string },

  // Operation Errors
  operationCancelled: (operationName: string): CLIError =>
    createError('OPERATION_CANCELLED', `Operation cancelled: ${operationName}`, {
      suggestion: 'Restart the operation if needed',
      recoverable: true,
    }),

  operationTimeout: (operationName: string, timeoutMs: number): CLIError =>
    createError(
      'OPERATION_TIMEOUT',
      `Operation timed out: ${operationName} (after ${timeoutMs}ms)`,
      {
        details: `Timeout: ${timeoutMs}ms`,
        suggestion: `Increase timeout or check if '${operationName}' is responding`,
        recoverable: true,
      }
    ),

  operationFailed: (operationName: string, reason: string): CLIError =>
    createError('OPERATION_FAILED', `Operation failed: ${operationName}`, {
      details: reason,
      suggestion: `Fix the issue and retry: ${reason}`,
      recoverable: true,
    }),

  // Parse Errors
  parseFailure: (format: string, filePath?: string, parseError?: string): CLIError =>
    createError('PARSE_FAILURE', `Failed to parse ${format}${filePath ? `: ${filePath}` : ''}`, {
      details: parseError,
      suggestion: parseError
        ? `Fix the ${format} syntax: ${parseError}`
        : `Check the ${format} format and try again`,
    }),

  // Format Errors
  unsupportedFormat: (format: string, supportedFormats: string[]): CLIError =>
    createError('UNSUPPORTED_FORMAT', `Unsupported format: ${format}`, {
      details: `Supported formats: ${supportedFormats.join(', ')}`,
      suggestion: `Use one of the supported formats: ${supportedFormats.join(', ')}`,
    }),

  // Authentication Errors
  authenticationFailed: (service?: string): CLIError =>
    createError(
      'AUTHENTICATION_FAILED',
      `Authentication failed${service ? ` for ${service}` : ''}`,
      {
        suggestion: 'Check your credentials and try again',
        recoverable: true,
      }
    ),

  authenticationExpired: (service?: string): CLIError =>
    createError(
      'AUTHENTICATION_EXPIRED',
      `Authentication expired${service ? ` for ${service}` : ''}`,
      {
        suggestion: 'Re-authenticate and try again',
        recoverable: true,
      }
    ),
} as const;

/**
 * Create custom error templates with consistent patterns
 */
export function createErrorTemplate<T extends CLIError>(
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
  register<T extends CLIError>(name: string, template: ErrorTemplate<T>): ErrorTemplateRegistry;
  get(name: string): ErrorTemplate | undefined;
  has(name: string): boolean;
  list(): readonly string[];
  clear(): ErrorTemplateRegistry;
  getState(): ErrorTemplateRegistryState;
}

/**
 * Create a functional error template registry
 */
export function createErrorTemplateRegistry(
  state: ErrorTemplateRegistryState = { templates: new Map() }
): ErrorTemplateRegistry {
  return {
    register<T extends CLIError>(name: string, template: ErrorTemplate<T>): ErrorTemplateRegistry {
      const newTemplates = new Map(state.templates);
      newTemplates.set(name, template);
      return createErrorTemplateRegistry({ templates: newTemplates });
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
      return createErrorTemplateRegistry({ templates: new Map() });
    },

    getState(): ErrorTemplateRegistryState {
      return state;
    },
  };
}

/**
 * Global error template registry instance
 */
export const globalErrorTemplates = createErrorTemplateRegistry();

/**
 * Helper function to create errors with consistent formatting
 */
export const errors = errorTemplates;
