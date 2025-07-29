import { createCoreError } from '@esteban-url/core'
import type { CoreError } from '@esteban-url/core'

/**
 * Standardized error codes for create-cli package
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
  UNKNOWN_OPTION: 'UNKNOWN_OPTION',
  UNEXPECTED_ARGUMENT: 'UNEXPECTED_ARGUMENT',
  PROJECT_NAME_REQUIRED: 'PROJECT_NAME_REQUIRED',
  ARGUMENT_PARSING_ERROR: 'ARGUMENT_PARSING_ERROR',

  // Generator errors
  PACKAGE_MANAGER_DETECTION_FAILED: 'PACKAGE_MANAGER_DETECTION_FAILED',
  CONFIG_GATHER_ERROR: 'CONFIG_GATHER_ERROR',
  GENERATE_COMMAND_ERROR: 'GENERATE_COMMAND_ERROR',
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

/**
 * Common error domain for create-cli package
 */
export const ERROR_DOMAIN = 'CLI_ERROR' as const

/**
 * Base error context interface
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
 * Create error context helper for TemplateCompiler component
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
 * Create error context helper for ArgsParser component
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
 * Create error context helper for Generator component
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
 * Common error suggestions for user-facing errors
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
