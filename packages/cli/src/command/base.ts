import { Command } from 'commander'
import chalk from 'chalk'
import type { Result } from '../core/errors/types.js'
import { displayError } from '../core/errors/handlers.js'
import { createError } from '../core/errors/factory.js'
import { createDefaultLogger, type Logger } from '../core/logger.js'
import { createFileSystem, type FileSystem } from '../filesystem/index.js'


export interface CommandContext {
  readonly projectRoot: string
  readonly logger: Logger
  readonly verbose: boolean
  readonly fs: FileSystem
}

export interface CommandOptions {
  readonly verbose?: boolean
  readonly dryRun?: boolean
}

export interface CommandConfig<T extends CommandOptions> {
  readonly name: string
  readonly description: string
  readonly options?: CommandOption[]
  readonly examples?: string[]
  readonly action: CommandAction<T>
  readonly validation?: CommandValidator<T>
}

export interface CommandOption {
  readonly flags: string
  readonly description: string
  readonly defaultValue?: any
}

export type CommandAction<T extends CommandOptions> = (
  options: T,
  context: CommandContext
) => Promise<Result<void>>

export type CommandValidator<T extends CommandOptions> = (options: T) => Result<T>

/**
 * Create a command with standard error handling and context
 */
export function createCommand<T extends CommandOptions>(
  config: CommandConfig<T>,
  globalContext: { projectRoot: string }
): Command {
  const command = new Command(config.name)
    .description(config.description)
    .option('-v, --verbose', 'show detailed output', false)

  // Add custom options
  if (config.options) {
    for (const option of config.options) {
      command.option(option.flags, option.description, option.defaultValue)
    }
  }

  // Add examples if provided
  if (config.examples && config.examples.length > 0) {
    command.addHelpText(
      'after',
      `\nExamples:\n${config.examples.map((ex) => `  ${ex}`).join('\n')}\n`
    )
  }

  // Set up action with error handling
  command.action(async (options: T) => {
    const context: CommandContext = {
      projectRoot: globalContext.projectRoot,
      logger: createDefaultLogger(options.verbose ?? false),
      verbose: options.verbose ?? false,
      fs: createFileSystem(),
    }

    try {
      // Validate options if validator provided
      if (config.validation) {
        const validationResult = config.validation(options)
        if (!validationResult.success) {
          displayError(validationResult.error, options.verbose ?? false)
          process.exit(1)
        }
      }

      // Execute command
      const result = await config.action(options, context)

      if (!result.success) {
        displayError(result.error, options.verbose ?? false)
        process.exit(1)
      }
    } catch (error) {
      console.error(chalk.red('Unexpected error:'))
      console.error(error)
      process.exit(1)
    }
  })

  return command
}

export async function executeWithPhases<T>(
  phases: CommandPhase<T>[],
  data: T,
  context: CommandContext
): Promise<Result<T>> {
  const { logger } = context

  for (const phase of phases) {
    logger.step(phase.name)

    const result = await phase.execute(data, context)
    if (!result.success) {
      logger.error(`Failed at phase: ${phase.name}`)
      return result
    }

    data = result.value
  }

  return { success: true, value: data }
}

export interface CommandPhase<T> {
  readonly name: string
  readonly execute: (data: T, context: CommandContext) => Promise<Result<T>>
}

export async function executeWithProgress<T>(
  task: () => Promise<Result<T>>,
  message: string,
  _context: CommandContext
): Promise<Result<T>> {
  const spinner = await import('ora').then((m) => m.default)
  const spin = spinner(message).start()

  try {
    const result = await task()

    if (result.success) {
      spin.succeed()
    } else {
      spin.fail()
    }

    return result
  } catch (error) {
    spin.fail()
    return {
      success: false,
      error: createError(
        'EXECUTION_ERROR',
        error instanceof Error ? error.message : 'Unknown error',
        { cause: error }
      ),
    }
  }
}

export async function executeWithDryRun<T>(
  task: () => Promise<Result<T>>,
  dryRunTask: () => Promise<Result<T>>,
  isDryRun: boolean,
  context: CommandContext
): Promise<Result<T>> {
  if (isDryRun) {
    context.logger.warning('DRY RUN MODE - No changes will be made')
    return dryRunTask()
  }

  return task()
}

export function composeCommands(commands: Command[], name: string, description: string): Command {
  const composedCommand = new Command(name).description(description)

  for (const command of commands) {
    composedCommand.addCommand(command)
  }

  return composedCommand
}

export function withGlobalOptions(command: Command): Command {
  return command
    .option('--no-color', 'disable colored output')
    .option('--quiet', 'suppress non-error output')
    .hook('preAction', (thisCommand) => {
      const options = thisCommand.opts()
      if (options.noColor) {
        chalk.level = 0
      }
    })
}

export function displaySummary(
  title: string,
  items: Array<{ label: string; value: string | number }>,
  _context: CommandContext
): void {
  console.log('')
  console.log(chalk.bold(title))

  for (const item of items) {
    console.log(`  ${chalk.gray(item.label)}: ${item.value}`)
  }

  console.log('')
}

export async function confirmAction(
  message: string,
  defaultValue: boolean = false
): Promise<boolean> {
  const inquirer = await import('@inquirer/prompts')

  const confirmed = await inquirer.confirm({
    message,
    default: defaultValue,
  })

  return confirmed
}
