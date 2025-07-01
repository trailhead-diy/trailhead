import { Command } from 'commander';
import chalk from 'chalk';
import type { Result } from '../core/errors/index.js';
import { displayError, createError } from '../core/errors/index.js';
import { createDefaultLogger } from '../core/index.js';
import { createFileSystem } from '../filesystem/index.js';
import { processCommandOptions } from '../utils/index.js';
import type { CommandContext, CommandPhase, CommandOption } from './types.js';

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
  context: CommandContext,
) => Promise<Result<void>>;

/**
 * Command validation function type
 * @template T - Command options type
 */
export type CommandValidator<T extends CommandOptions> = (
  options: T,
) => Result<T>;

/**
 * Create a command with standard error handling and context
 * @template T - Command options type extending CommandOptions
 * @param config - Command configuration
 * @param globalContext - Global CLI context (project root, etc.)
 * @returns Configured Commander.js Command instance
 * @example
 * ```typescript
 * const buildCommand = createCommand({
 *   name: 'build',
 *   description: 'Build the project',
 *   arguments: '[output-dir]',
 *   options: [
 *     { flags: '--watch', description: 'Watch for changes' }
 *   ],
 *   action: async (options, context) => {
 *     // Command implementation
 *     return ok(undefined);
 *   }
 * }, { projectRoot: process.cwd() });
 * ```
 */
export function createCommand<T extends CommandOptions>(
  config: CommandConfig<T>,
  globalContext: { projectRoot: string },
): Command {
  const command = new Command(config.name)
    .description(config.description)
    .option('-v, --verbose', 'show detailed output', false);

  // Add arguments if specified
  if (config.arguments) {
    command.arguments(config.arguments);
  }

  // Add custom options
  if (config.options) {
    for (const option of config.options) {
      if (option.flags) {
        command.option(
          option.flags,
          option.description,
          option.defaultValue ?? option.default,
        );
      }
    }
  }

  // Add examples if provided
  if (config.examples && config.examples.length > 0) {
    command.addHelpText(
      'after',
      `\nExamples:\n${config.examples.map((ex) => `  ${ex}`).join('\n')}\n`,
    );
  }

  // Set up action with error handling
  command.action(async (...args: any[]) => {
    // Commander passes options as the last argument
    const rawOptions = args[args.length - 1];
    // All arguments before the last are positional arguments
    const positionalArgs = args.slice(0, -1);

    // Process options to handle types and filter undefined values
    const options: T = processCommandOptions<T>(
      rawOptions,
      config.options?.map(opt => ({
        // Extract name from flags like '--confidence <number>' -> 'confidence'
        name: opt.name || (opt.flags ? opt.flags.match(/--(\w+)/)?.[1] : '') || '',
        type: opt.type,
      })),
    );

    const context: CommandContext = {
      projectRoot: globalContext.projectRoot,
      logger: createDefaultLogger(options.verbose ?? false),
      verbose: options.verbose ?? false,
      fs: createFileSystem(),
      args: positionalArgs,
    };

    try {
      // Validate options if validator provided
      if (config.validation) {
        const validationResult = config.validation(options);
        if (!validationResult.success) {
          displayError(validationResult.error, options.verbose ?? false);
          process.exit(1);
        }
      }

      // Execute command
      const result = await config.action(options, context);

      if (!result.success) {
        displayError(result.error, options.verbose ?? false);
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('Unexpected error:'));
      console.error(error);
      process.exit(1);
    }
  });

  return command;
}

export async function executeWithPhases<T>(
  phases: CommandPhase<T>[],
  data: T,
  context: CommandContext,
): Promise<Result<T>> {
  const { logger } = context;

  for (const phase of phases) {
    logger.step(phase.name);

    const result = await phase.execute(data, context);
    if (!result.success) {
      logger.error(`Failed at phase: ${phase.name}`);
      return result;
    }

    data = result.value;
  }

  return { success: true, value: data };
}


export async function executeWithProgress<T>(
  task: () => Promise<Result<T>>,
  message: string,
  _context: CommandContext,
): Promise<Result<T>> {
  const spinner = await import('ora').then((m) => m.default);
  const spin = spinner(message).start();

  try {
    const result = await task();

    if (result.success) {
      spin.succeed();
    } else {
      spin.fail();
    }

    return result;
  } catch (error) {
    spin.fail();
    return {
      success: false,
      error: createError(
        'EXECUTION_ERROR',
        error instanceof Error ? error.message : 'Unknown error',
        { cause: error },
      ),
    };
  }
}

export async function executeWithDryRun<T>(
  task: () => Promise<Result<T>>,
  dryRunTask: () => Promise<Result<T>>,
  isDryRun: boolean,
  context: CommandContext,
): Promise<Result<T>> {
  if (isDryRun) {
    context.logger.warning('DRY RUN MODE - No changes will be made');
    return dryRunTask();
  }

  return task();
}

export function composeCommands(
  commands: Command[],
  name: string,
  description: string,
): Command {
  const composedCommand = new Command(name).description(description);

  for (const command of commands) {
    composedCommand.addCommand(command);
  }

  return composedCommand;
}

export function withGlobalOptions(command: Command): Command {
  return command
    .option('--no-color', 'disable colored output')
    .option('--quiet', 'suppress non-error output')
    .hook('preAction', (thisCommand) => {
      const options = thisCommand.opts();
      if (options.noColor) {
        chalk.level = 0;
      }
    });
}

export function displaySummary(
  title: string,
  items: Array<{ label: string; value: string | number }>,
  _context: CommandContext,
): void {
  console.log('');
  console.log(chalk.bold(title));

  for (const item of items) {
    console.log(`  ${chalk.gray(item.label)}: ${item.value}`);
  }

  console.log('');
}

export async function confirmAction(
  message: string,
  defaultValue: boolean = false,
): Promise<boolean> {
  const inquirer = await import('@inquirer/prompts');

  const confirmed = await inquirer.confirm({
    message,
    default: defaultValue,
  });

  return confirmed;
}
