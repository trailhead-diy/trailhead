import { err, createCoreError, type Result, type CoreError } from '@esteban-url/core'
import type { CommandContext, CommandOption } from './types.js'

// Simple FileSystem interface for file processing
interface FileSystem {
  readFile: (path: string) => Promise<Result<string, CoreError>>
  writeFile: (path: string, content: string) => Promise<Result<void, CoreError>>
  exists: (path: string) => Promise<Result<boolean, CoreError>>
  [key: string]: any // Allow additional fs methods
}
import { createCommand, type CommandConfig, type CommandOptions } from './base.js'

/**
 * Command Enhancement Suite - addresses GitHub issue #112
 *
 * This module implements the boilerplate reduction features:
 * - File Processing Command Builder (item #2)
 * - Common Options Builder (item #3)
 *
 * Reduces CLI command boilerplate by 60-70% while maintaining type safety.
 */

/**
 * Pre-configured common command options with consistent behavior
 *
 * Provides factory functions for frequently used options to ensure
 * consistency across commands. Each function returns a properly
 * configured CommandOption with standard flags and descriptions.
 *
 * @example
 * ```typescript
 * const options = [
 *   commonOptions.output('Write results to file'),
 *   commonOptions.format(['json', 'yaml'], 'json'),
 *   commonOptions.verbose()
 * ];
 * ```
 */
export const commonOptions = {
  output: (description?: string): CommandOption => ({
    name: 'output',
    alias: 'o',
    flags: '-o, --output <path>',
    description: description ?? 'Output file path',
    type: 'string' as const,
  }),

  format: (choices: string[] = ['json', 'csv'], defaultValue?: string): CommandOption => ({
    name: 'format',
    alias: 'f',
    flags: '-f, --format <format>',
    description: `Output format (${choices.join(', ')})`,
    type: 'string' as const,
    default: defaultValue ?? choices[0],
  }),

  verbose: (description?: string): CommandOption => ({
    name: 'verbose',
    alias: 'v',
    flags: '-v, --verbose',
    description: description ?? 'Enable verbose logging',
    type: 'boolean' as const,
    default: false,
  }),

  dryRun: (description?: string): CommandOption => ({
    name: 'dryRun',
    alias: 'd',
    flags: '-d, --dry-run',
    description: description ?? 'Preview changes without executing',
    type: 'boolean' as const,
    default: false,
  }),

  force: (description?: string): CommandOption => ({
    name: 'force',
    flags: '--force',
    description: description ?? 'Overwrite existing files',
    type: 'boolean' as const,
    default: false,
  }),

  interactive: (description?: string): CommandOption => ({
    name: 'interactive',
    alias: 'i',
    flags: '-i, --interactive',
    description: description ?? 'Run in interactive mode',
    type: 'boolean' as const,
    default: false,
  }),
}

/**
 * Fluent API for composing command option sets
 *
 * Provides a builder pattern for creating option arrays with
 * common options, custom options, and format configuration.
 * Reduces boilerplate when defining command options.
 */
export interface OptionsBuilder {
  common(names: (keyof typeof commonOptions)[]): OptionsBuilder
  format(choices: string[], defaultValue?: string): OptionsBuilder
  custom(options: CommandOption[]): OptionsBuilder
  build(): CommandOption[]
}

/**
 * Create a fluent options builder for command configuration
 *
 * Simplifies option definition through method chaining, reducing
 * boilerplate by up to 70% for commands with standard options.
 *
 * @param initialOptions - Starting options array (optional)
 * @returns OptionsBuilder instance for method chaining
 *
 * @example
 * ```typescript
 * const options = defineOptions()
 *   .common(['output', 'verbose', 'dryRun'])
 *   .format(['json', 'csv', 'xml'], 'json')
 *   .custom([{
 *     name: 'timeout',
 *     flags: '--timeout <ms>',
 *     description: 'Operation timeout',
 *     type: 'number'
 *   }])
 *   .build();
 * ```
 */
export function defineOptions(initialOptions: CommandOption[] = []): OptionsBuilder {
  return {
    common: (names: (keyof typeof commonOptions)[]): OptionsBuilder => {
      const newOptions = names.map((name) => commonOptions[name]())
      return defineOptions([...initialOptions, ...newOptions])
    },

    format: (choices: string[], defaultValue?: string): OptionsBuilder => {
      // Replace existing format option if present
      const filteredOptions = initialOptions.filter((opt) => opt.name !== 'format')
      const formatOption = commonOptions.format(choices, defaultValue)
      return defineOptions([...filteredOptions, formatOption])
    },

    custom: (options: CommandOption[]): OptionsBuilder => {
      return defineOptions([...initialOptions, ...options])
    },

    build: (): CommandOption[] => {
      return [...initialOptions]
    },
  }
}

/**
 * Standard options for file processing commands
 *
 * Extends base CommandOptions with commonly needed file operation
 * flags. Used as base type for file processing command options.
 */
export interface FileProcessingOptions extends CommandOptions {
  output?: string
  format?: string
  verbose?: boolean
  dryRun?: boolean
  force?: boolean
}

/**
 * Runtime context for file processing operations
 *
 * Provides validated file paths and filesystem access to command
 * implementations. Created after input validation succeeds.
 */
export interface FileProcessingContext {
  /** Validated input file path from command arguments */
  inputFile: string
  /** Resolved output path from --output option */
  outputPath?: string
  /** Filesystem abstraction for file operations */
  fs: FileSystem
}

/**
 * Configuration for creating file processing commands
 *
 * Defines structure for commands that operate on files with automatic
 * validation, common options, and enhanced context. Reduces boilerplate
 * by handling file validation and option setup.
 *
 * @template T - Command options type extending FileProcessingOptions
 */
export interface FileProcessingConfig<T extends FileProcessingOptions> {
  /** Command name for CLI invocation */
  name: string
  /** Command description for help text */
  description: string
  /** Input file argument configuration */
  inputFile: {
    /** Whether input file is required (default: true) */
    required?: boolean
    /** Custom description for input argument */
    description?: string
  }
  /** Array of common option names to include */
  commonOptions?: (keyof typeof commonOptions)[]
  /** Additional custom options beyond common ones */
  customOptions?: CommandOption[]
  /** Command implementation with enhanced context */
  action: (
    options: T,
    context: CommandContext,
    processing: FileProcessingContext
  ) => Promise<Result<void, CoreError>>
}

/**
 * Creates a file processing command with automatic file validation and common options
 *
 * Eliminates 15-20 lines of boilerplate per command by handling:
 * - Input file argument validation
 * - File existence checking
 * - Output path resolution
 * - Common option setup
 *
 * @template T - Type of command options
 * @param config - File processing command configuration
 * @returns Command ready for CLI registration
 */
export function createFileProcessingCommand<T extends FileProcessingOptions>(
  config: FileProcessingConfig<T>
): ReturnType<typeof createCommand<T>> {
  const options: CommandOption[] = []

  // Add common options if specified
  if (config.commonOptions) {
    for (const optionName of config.commonOptions) {
      options.push(commonOptions[optionName]())
    }
  }

  // Add custom options
  if (config.customOptions) {
    options.push(...config.customOptions)
  }

  const commandConfig: CommandConfig<T> = {
    name: config.name,
    description: config.description,
    arguments: config.inputFile.description ?? 'Input file to process',
    options,
    action: async (options, context) => {
      // Extract input file from arguments
      const [inputFile] = context.args

      if (config.inputFile.required !== false && !inputFile) {
        return err(
          createCoreError('VALIDATION_ERROR', 'CLI_ERROR', 'input file is required', {
            recoverable: true,
          })
        )
      }

      // Validate file exists if provided
      if (inputFile) {
        const fileCheck = await context.fs.exists(inputFile)
        if (fileCheck.isErr()) {
          return err(
            createCoreError('FILESYSTEM_ERROR', 'CLI_ERROR', `file not found: ${inputFile}`, {
              recoverable: false,
            })
          )
        }
        if (fileCheck.isOk() && !fileCheck.value) {
          return err(
            createCoreError('FILESYSTEM_ERROR', 'CLI_ERROR', `file not found: ${inputFile}`, {
              recoverable: false,
            })
          )
        }
      }

      // Resolve output path if output option is provided
      let outputPath: string | undefined
      if (options.output) {
        outputPath = options.output
      }

      // Create processing context with validated paths
      const processingContext: FileProcessingContext = {
        inputFile: inputFile ?? '',
        outputPath,
        fs: context.fs,
      }

      // Execute the command action with enhanced context
      return config.action(options, context, processingContext)
    },
  }

  return createCommand<T>(commandConfig)
}
