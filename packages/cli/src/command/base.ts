import { Command } from 'commander';
import type { Result } from '../core/errors/index.js';
import type { CommandContext, CommandOption } from './types.js';
import { validateCommandConfigWithCache } from './validation.js';

/**
 * Base command options available to all commands
 */
export interface CommandOptions {
  /** Enable verbose logging output */
  readonly verbose?: boolean;
  /** Preview mode - show what would be done without executing */
  readonly dryRun?: boolean;
}

/**
 * Configuration for creating a CLI command
 * @template T - Command options type extending CommandOptions
 */
export interface CommandConfig<T extends CommandOptions> {
  /** Command name (used for CLI invocation) */
  readonly name: string;
  /** Command description for help text */
  readonly description: string;
  /** Command arguments specification (e.g., '<input> [output]') */
  readonly arguments?: string;
  /** Available command options/flags */
  readonly options?: CommandOption[];
  /** Usage examples for help text */
  readonly examples?: string[];
  /** Main command implementation */
  readonly action: CommandAction<T>;
  /** Optional validation for command options */
  readonly validation?: CommandValidator<T>;
}

/**
 * Command action function type
 * @template T - Command options type
 */
export type CommandAction<T extends CommandOptions> = (
  options: T,
  context: CommandContext
) => Promise<Result<void>>;

/**
 * Command validation function type
 * @template T - Command options type
 */
export type CommandValidator<T extends CommandOptions> = (options: T) => Result<T>;

/**
 * Create a command object for use with createCLI
 *
 * Creates a command interface object that can be registered with a CLI instance.
 * The command configuration is validated at creation time to ensure proper structure.
 *
 * @template T - Command options type extending CommandOptions
 * @param config - Command configuration object
 * @param config.name - Command name used for CLI invocation (e.g., 'build', 'test')
 * @param config.description - Description shown in help text
 * @param config.arguments - Optional arguments specification (e.g., '<input> [output]')
 * @param config.options - Array of command options/flags
 * @param config.examples - Array of usage examples for help text
 * @param config.action - Async function that implements the command logic
 * @param config.validation - Optional validation function for command options
 * @returns Command interface object ready for CLI registration
 * @throws {Error} When command configuration is invalid
 *
 * @example
 * Basic command without options:
 * ```typescript
 * const testCommand = createCommand({
 *   name: 'test',
 *   description: 'Run tests',
 *   action: async (options, context) => {
 *     context.logger.info('Running tests...');
 *     return { success: true, value: undefined };
 *   }
 * });
 * ```
 *
 * @example
 * Command with options and arguments:
 * ```typescript
 * interface BuildOptions extends CommandOptions {
 *   output?: string;
 *   watch?: boolean;
 * }
 *
 * const buildCommand = createCommand<BuildOptions>({
 *   name: 'build',
 *   description: 'Build the project',
 *   arguments: '[source-dir]',
 *   options: [
 *     {
 *       flags: '-o, --output <dir>',
 *       description: 'Output directory',
 *       type: 'string'
 *     },
 *     {
 *       flags: '--watch',
 *       description: 'Watch for changes',
 *       type: 'boolean'
 *     }
 *   ],
 *   examples: [
 *     'build src',
 *     'build --output dist --watch'
 *   ],
 *   action: async (options, context) => {
 *     // Implementation
 *     return { success: true, value: undefined };
 *   }
 * });
 * ```
 */
export function createCommand<T extends CommandOptions>(
  config: CommandConfig<T>
): import('./types.js').Command<T> {
  // Validate configuration
  const validationResult = validateCommandConfigWithCache(config);
  if (!validationResult.success) {
    throw new Error(`Invalid command configuration: ${validationResult.error.message}`);
  }

  return {
    name: config.name,
    description: config.description,
    arguments: config.arguments,
    options: config.options,
    execute: config.action,
  };
}
