import { createCoreError } from '@esteban-url/core'
import type { CoreError } from '@esteban-url/core'

/**
 * Standardized error codes for create-cli package
 */
export const ERROR_CODES = {
  // Template-related errors
  TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',
  TEMPLATE_READ_FAILED: 'TEMPLATE_READ_FAILED',
  TEMPLATE_COMPILE_FAILED: 'TEMPLATE_COMPILE_FAILED',
  TEMPLATE_RENDER_FAILED: 'TEMPLATE_RENDER_FAILED',
  UNRESOLVED_VARIABLES: 'UNRESOLVED_VARIABLES',
  CONTEXT_SANITIZATION_FAILED: 'CONTEXT_SANITIZATION_FAILED',
  OBJECT_SANITIZATION_FAILED: 'OBJECT_SANITIZATION_FAILED',
  PRECOMPILE_FAILED: 'PRECOMPILE_FAILED',

  // Argument parsing errors
  MISSING_TEMPLATE_VALUE: 'MISSING_TEMPLATE_VALUE',
  INVALID_TEMPLATE_VALUE: 'INVALID_TEMPLATE_VALUE',
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

  // Mock scaffolder errors
  INVALID_PROJECT_NAME: 'INVALID_PROJECT_NAME',
  MISSING_REQUIRED_VARIABLE: 'MISSING_REQUIRED_VARIABLE',
  INVALID_VARIABLE_TYPE: 'INVALID_VARIABLE_TYPE',
  INVALID_VARIABLE_CHOICE: 'INVALID_VARIABLE_CHOICE',
  VARIABLE_VALIDATION_FAILED: 'VARIABLE_VALIDATION_FAILED',
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
 * Create error context helper for MockScaffolder component
 */
export function createMockScaffolderError(
  code: ErrorCode,
  message: string,
  context: Omit<BaseErrorContext, 'component'> = {}
): CoreError {
  return createCoreError(code, ERROR_DOMAIN, message, {
    component: 'MockScaffolder',
    recoverable: true,
    ...context,
  })
}

/**
 * Common error suggestions for user-facing errors
 */
export const ERROR_SUGGESTIONS = {
  TEMPLATE_OPTIONS: 'Use --template basic or --template advanced',
  PACKAGE_MANAGER_OPTIONS: 'Use --package-manager npm or --package-manager pnpm',
  HELP_COMMAND: 'Run with --help to see available options',
  PROJECT_NAME_FORMAT:
    'Project names can only contain lowercase letters, numbers, hyphens, and underscores',
  PROJECT_NAME_REQUIRED: 'Provide a project name as the first argument',
  NON_INTERACTIVE_HELP: 'Provide a project name or remove --non-interactive flag',
  CLI_USAGE: 'create-trailhead-cli generate my-project-name',
} as const
