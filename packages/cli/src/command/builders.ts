import type { Result } from 'neverthrow';
import type { CoreError } from '@trailhead/core';
import type { FileSystem } from '../filesystem/index.js';
import type { CommandContext, CommandOption } from './types.js';
import type { CommandConfig, CommandOptions } from './base.js';
import { createCommand } from './base.js';
import { err } from 'neverthrow';
import { errors } from '../core/error-templates.js';

/**
 * Command Enhancement Suite - addresses GitHub issue #112
 *
 * This module implements the boilerplate reduction features:
 * - File Processing Command Builder (item #2)
 * - Common Options Builder (item #3)
 *
 * Reduces CLI command boilerplate by 60-70% while maintaining type safety.
 */

// Common option definitions with consistent behavior
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
};

// Fluent API for building option sets
export interface OptionsBuilder {
  common(names: (keyof typeof commonOptions)[]): OptionsBuilder;
  format(choices: string[], defaultValue?: string): OptionsBuilder;
  custom(options: CommandOption[]): OptionsBuilder;
  build(): CommandOption[];
}

export function defineOptions(initialOptions: CommandOption[] = []): OptionsBuilder {
  return {
    common: (names: (keyof typeof commonOptions)[]): OptionsBuilder => {
      const newOptions = names.map(name => commonOptions[name]());
      return defineOptions([...initialOptions, ...newOptions]);
    },

    format: (choices: string[], defaultValue?: string): OptionsBuilder => {
      // Replace existing format option if present
      const filteredOptions = initialOptions.filter(opt => opt.name !== 'format');
      const formatOption = commonOptions.format(choices, defaultValue);
      return defineOptions([...filteredOptions, formatOption]);
    },

    custom: (options: CommandOption[]): OptionsBuilder => {
      return defineOptions([...initialOptions, ...options]);
    },

    build: (): CommandOption[] => {
      return [...initialOptions];
    },
  };
}

// File processing command builder types
export interface FileProcessingOptions extends CommandOptions {
  output?: string;
  format?: string;
  verbose?: boolean;
  dryRun?: boolean;
  force?: boolean;
}

export interface FileProcessingContext {
  inputFile: string;
  outputPath?: string;
  fs: FileSystem;
}

export interface FileProcessingConfig<T extends FileProcessingOptions> {
  name: string;
  description: string;
  inputFile: {
    required?: boolean;
    description?: string;
  };
  commonOptions?: (keyof typeof commonOptions)[];
  customOptions?: CommandOption[];
  action: (
    options: T,
    context: CommandContext,
    processing: FileProcessingContext
  ) => Promise<Result<void, CoreError>>;
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
  const options: CommandOption[] = [];

  // Add common options if specified
  if (config.commonOptions) {
    for (const optionName of config.commonOptions) {
      options.push(commonOptions[optionName]());
    }
  }

  // Add custom options
  if (config.customOptions) {
    options.push(...config.customOptions);
  }

  const commandConfig: CommandConfig<T> = {
    name: config.name,
    description: config.description,
    arguments: config.inputFile.description ?? 'Input file to process',
    options,
    action: async (options, context) => {
      // Extract input file from arguments
      const [inputFile] = context.args;

      if (config.inputFile.required !== false && !inputFile) {
        return err(errors.requiredFieldMissing('input file'));
      }

      // Validate file exists if provided
      if (inputFile) {
        const fileCheck = await context.fs.exists(inputFile);
        if (fileCheck.isErr()) {
          return err(errors.fileNotFound(inputFile));
        }
        if (fileCheck.isOk() && !fileCheck.value) {
          return err(errors.fileNotFound(inputFile));
        }
      }

      // Resolve output path if output option is provided
      let outputPath: string | undefined;
      if (options.output) {
        outputPath = options.output;
      }

      // Create processing context with validated paths
      const processingContext: FileProcessingContext = {
        inputFile: inputFile ?? '',
        outputPath,
        fs: context.fs,
      };

      // Execute the command action with enhanced context
      return config.action(options, context, processingContext);
    },
  };

  return createCommand<T>(commandConfig);
}
