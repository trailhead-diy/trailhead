/**
 * Error handling utilities for create-cli package.
 *
 * Provides standardized error codes, factory functions for consistent error
 * creation, and user-facing error suggestions.
 *
 * @module core/errors
 */

import { createCoreError, type CoreError } from '@trailhead/core'

/**
 * Standardized error codes for create-cli package.
 *
 * Grouped by category: template errors, argument parsing, and generator errors.
 */
export const ERROR_CODES = {
  // Template-related errors
  TEMPLATE_READ_FAILED: 'TEMPLATE_READ_FAILED',
  TEMPLATE_COMPILE_FAILED: 'TEMPLATE_COMPILE_FAILED',
  UNRESOLVED_VARIABLES: 'UNRESOLVED_VARIABLES',
  CONTEXT_SANITIZATION_FAILED: 'CONTEXT_SANITIZATION_FAILED',
  OBJECT_SANITIZATION_FAILED: 'OBJECT_SANITIZATION_FAILED',
  PRECOMPILE_FAILED: 'PRECOMPILE_FAILED',

  // Argument parsing errors
  MISSING_PACKAGE_MANAGER_VALUE: 'MISSING_PACKAGE_MANAGER_VALUE',
  INVALID_PACKAGE_MANAGER_VALUE: 'INVALID_PACKAGE_MANAGER_VALUE',
  INVALID_PROJECT_NAME: 'INVALID_PROJECT_NAME',
  UNKNOWN_OPTION: 'UNKNOWN_OPTION',
  UNEXPECTED_ARGUMENT: 'UNEXPECTED_ARGUMENT',
  PROJECT_NAME_REQUIRED: 'PROJECT_NAME_REQUIRED',
  ARGUMENT_PARSING_ERROR: 'ARGUMENT_PARSING_ERROR',

  // Generator errors
  PACKAGE_MANAGER_DETECTION_FAILED: 'PACKAGE_MANAGER_DETECTION_FAILED',
  CONFIG_GATHER_ERROR: 'CONFIG_GATHER_ERROR',
  GENERATE_COMMAND_ERROR: 'GENERATE_COMMAND_ERROR',
} as const

/** Union type of all error codes in ERROR_CODES */
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

/** Common error domain identifier for create-cli package errors */
export const ERROR_DOMAIN = 'CLI_ERROR' as const

/**
 * Base context interface for error factory functions.
 *
 * All error factories accept this context to provide consistent metadata.
 */
export interface BaseErrorContext {
  readonly component: string
  readonly operation?: string
  readonly recoverable?: boolean
  readonly suggestion?: string
  readonly context?: Record<string, any>
  readonly cause?: Error | CoreError
}

/**
 * Create a CoreError for template compilation failures.
 *
 * @param code - Error code from ERROR_CODES
 * @param message - Human-readable error message
 * @param context - Additional error context (operation, cause, etc.)
 * @returns CoreError with component set to 'TemplateCompiler'
 */
export function createTemplateCompilerError(
  code: ErrorCode,
  message: string,
  context: Omit<BaseErrorContext, 'component'> = {}
): CoreError {
  return createCoreError(code, ERROR_DOMAIN, message, {
    component: 'TemplateCompiler',
    ...context,
  })
}

/**
 * Create a CoreError for argument parsing failures.
 *
 * Sets operation to 'parseArguments' and marks as recoverable by default.
 *
 * @param code - Error code from ERROR_CODES
 * @param message - Human-readable error message
 * @param context - Additional error context (cause, suggestion, etc.)
 * @returns CoreError with component set to 'ArgsParser'
 */
export function createArgsParserError(
  code: ErrorCode,
  message: string,
  context: Omit<BaseErrorContext, 'component' | 'operation'> = {}
): CoreError {
  return createCoreError(code, ERROR_DOMAIN, message, {
    component: 'ArgsParser',
    operation: 'parseArguments',
    recoverable: true,
    ...context,
  })
}

/**
 * Create a CoreError for project generation failures.
 *
 * @param code - Error code from ERROR_CODES
 * @param message - Human-readable error message
 * @param context - Additional error context (operation, cause, etc.)
 * @returns CoreError with component set to 'Generator'
 */
export function createGeneratorError(
  code: ErrorCode,
  message: string,
  context: Omit<BaseErrorContext, 'component'> = {}
): CoreError {
  return createCoreError(code, ERROR_DOMAIN, message, {
    component: 'Generator',
    ...context,
  })
}

/**
 * User-facing error suggestions keyed by error type.
 *
 * These messages provide actionable guidance for common errors.
 */
export const ERROR_SUGGESTIONS = {
  PACKAGE_MANAGER_OPTIONS: 'Use --package-manager npm or --package-manager pnpm',
  HELP_COMMAND: 'Run with --help to see available options',
  PROJECT_NAME_FORMAT:
    'Project names can only contain lowercase letters, numbers, hyphens, and underscores',
  PROJECT_NAME_REQUIRED: 'Provide a project name as the first argument',
  NON_INTERACTIVE_HELP: 'Provide a project name or remove --non-interactive flag',
  CLI_USAGE: 'create-trailhead-cli generate my-project-name',
} as const
