import type { CommandContext, CommandPhase } from './types.js'
import type { Result, CoreError } from '@esteban-url/core'
import { ok, err, createCoreError } from '@esteban-url/core'
import { chalk } from '../utils/chalk.js'

export interface InteractiveCommandOptions {
  readonly interactive?: boolean
  readonly skipPrompts?: boolean
}

export async function executeInteractiveCommand<T extends InteractiveCommandOptions, R>(
  options: T,
  promptFn: () => Promise<Partial<T>>,
  executeFn: (finalOptions: T) => Promise<Result<R, CoreError>>,
  context: CommandContext
): Promise<Result<R, CoreError>> {
  let finalOptions = options

  // Run interactive prompts if needed
  if (options.interactive && !options.skipPrompts) {
    context.logger.info('Running in interactive mode...')

    try {
      const promptResults = await promptFn()
      // Merge prompt results with CLI options (CLI takes precedence)
      finalOptions = { ...promptResults, ...options } as T
    } catch (error) {
      return err(
        createCoreError('PROMPT_ERROR', 'CLI_ERROR', 'Interactive prompts failed', {
          recoverable: true,
          cause: error,
          suggestion: 'Check the prompt configuration and try again',
        })
      )
    }
  }

  // Execute with final options
  return executeFn(finalOptions)
}

export interface ValidationRule<T> {
  readonly name: string
  readonly validate: (value: T) => Result<T, CoreError>
  readonly required?: boolean
}

export async function executeWithValidation<T, R>(
  data: T,
  rules: ValidationRule<T>[],
  executeFn: (validData: T) => Promise<Result<R, CoreError>>,
  context: CommandContext
): Promise<Result<R, CoreError>> {
  // Run validation rules
  for (const rule of rules) {
    const result = rule.validate(data)

    if (result.isErr()) {
      context.logger.error(`Validation failed: ${rule.name}`)
      return err(result.error)
    }

    // Update data if validator transformed it
    data = result.value
  }

  context.logger.debug('All validations passed')
  return executeFn(data)
}

export interface FileSystemOperation<T> {
  readonly name: string
  readonly execute: () => Promise<Result<T, CoreError>>
  readonly rollback?: () => Promise<void>
}

export async function executeFileSystemOperations<T>(
  operations: FileSystemOperation<T>[],
  context: CommandContext
): Promise<Result<T[], CoreError>> {
  const results: T[] = []
  const completedOps: FileSystemOperation<T>[] = []

  for (const op of operations) {
    context.logger.debug(`Executing: ${op.name}`)

    try {
      const result = await op.execute()

      if (result.isErr()) {
        // Rollback completed operations
        if (completedOps.length > 0) {
          context.logger.warning('Rolling back changes...')

          for (const completedOp of completedOps.reverse()) {
            if (completedOp.rollback) {
              try {
                await completedOp.rollback()
                context.logger.debug(`Rolled back: ${completedOp.name}`)
              } catch (error) {
                context.logger.error(`Failed to rollback: ${completedOp.name}: ${error}`)
              }
            }
          }
        }

        return err(result.error)
      }

      results.push(result.value)
      completedOps.push(op)
    } catch (error) {
      return err(
        createCoreError('OPERATION_ERROR', 'CLI_ERROR', `Operation failed: ${op.name}`, {
          recoverable: false,
          cause: error,
        })
      )
    }
  }

  return ok(results)
}

export interface SubprocessConfig {
  readonly command: string
  readonly args: string[]
  readonly cwd?: string
  readonly env?: Record<string, string>
}

export async function executeSubprocess(
  config: SubprocessConfig,
  context: CommandContext
): Promise<Result<string, CoreError>> {
  const { spawn } = await import('child_process')
  const { command, args, cwd, env } = config

  return new Promise((resolve) => {
    context.logger.debug(`Spawning: ${command} ${args.join(' ')}`)

    const child = spawn(command, args, {
      cwd: cwd ?? process.cwd(),
      env: { ...process.env, ...env },
      stdio: context.verbose ? 'inherit' : 'pipe',
    })

    let stdout = ''
    let stderr = ''

    if (!context.verbose) {
      child.stdout?.on('data', (data) => {
        stdout += data.toString()
      })
      child.stderr?.on('data', (data) => {
        stderr += data.toString()
      })
    }

    child.on('error', (error) => {
      resolve(
        err(
          createCoreError('SUBPROCESS_ERROR', 'CLI_ERROR', `Failed to spawn ${command}`, {
            recoverable: false,
            cause: error,
          })
        )
      )
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve(ok(stdout))
      } else {
        resolve(
          err(
            createCoreError(
              'SUBPROCESS_EXIT_ERROR',
              'CLI_ERROR',
              `${command} exited with code ${code}`,
              {
                recoverable: false,
                context: { stderr: stderr || undefined },
              }
            )
          )
        )
      }
    })
  })
}

/**
 * Execute operations in batches with concurrency control
 */
export async function executeBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<Result<R, CoreError>>,
  options: {
    batchSize: number
    onProgress?: (completed: number, total: number) => void
  },
  _context: CommandContext
): Promise<Result<R[], CoreError>> {
  const results: R[] = []
  const { batchSize, onProgress } = options

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)

    // Process batch in parallel
    const batchPromises = batch.map((item) => processor(item))
    const batchResults = await Promise.all(batchPromises)

    // Check for failures
    for (const result of batchResults) {
      if (result.isErr()) {
        return err(result.error)
      }
      results.push(result.value)
    }

    // Report progress
    if (onProgress) {
      onProgress(Math.min(i + batchSize, items.length), items.length)
    }
  }

  return ok(results)
}

export interface ConfigurationOptions {
  readonly config?: string
  readonly preset?: string
  readonly override?: Record<string, any>
}

export async function executeWithConfiguration<T extends ConfigurationOptions, R>(
  options: T,
  loadConfigFn: (path?: string) => Promise<Result<Record<string, any>, CoreError>>,
  executeFn: (config: Record<string, any>) => Promise<Result<R, CoreError>>,
  context: CommandContext
): Promise<Result<R, CoreError>> {
  // Load base configuration
  const configResult = await loadConfigFn(options.config)
  if (configResult.isErr()) {
    return err(configResult.error)
  }

  let config = configResult.value

  // Apply preset if specified
  if (options.preset) {
    context.logger.debug(`Applying preset: ${options.preset}`)
    // Preset logic would go here
  }

  // Apply overrides
  if (options.override) {
    config = { ...config, ...options.override }
  }

  return executeFn(config)
}

/**
 * Execute command phases in sequence with progress tracking
 *
 * Runs multiple phases sequentially, passing data between phases and providing
 * progress feedback. If any phase fails, execution stops and the error is returned.
 *
 * Used for multi-step file transformation workflows.
 *
 * @template T - Type of data passed between phases
 * @param phases - Array of phases to execute in order
 * @param initialData - Initial data to pass to the first phase
 * @param context - Command execution context
 * @returns Result with final data from last phase or error from failed phase
 */
export async function executeWithPhases<T>(
  phases: CommandPhase<T>[],
  initialData: T,
  context: CommandContext
): Promise<Result<T, CoreError>> {
  let currentData = initialData
  const totalPhases = phases.length

  context.logger.info(`Starting ${totalPhases} phase execution...`)

  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i]
    const phaseNumber = i + 1

    context.logger.step(phase.name)

    try {
      const result = await phase.execute(currentData, context)

      if (result.isErr()) {
        context.logger.error(`Phase ${phaseNumber} failed: ${phase.name}`)
        return result
      }

      currentData = result.value

      if (context.verbose) {
        context.logger.success(`Phase ${phaseNumber} completed: ${phase.name}`)
      }
    } catch (error) {
      return err(
        createCoreError('PHASE_ERROR', 'CLI_ERROR', `Phase execution failed: ${phase.name}`, {
          recoverable: false,
          cause: error,
        })
      )
    }
  }

  context.logger.success(`All ${totalPhases} phases completed successfully`)
  return ok(currentData)
}

/**
 * Execute function with dry-run support
 *
 * If dryRun option is enabled, shows what would be done without executing.
 * Otherwise executes normally. Provides user confirmation for destructive operations.
 *
 * Used for safe preview of file transformation operations.
 *
 * @template T - Type of configuration data
 * @template R - Type of execution result
 * @param options - Options including dryRun flag
 * @param executeFn - Function to execute (or simulate in dry-run)
 * @param context - Command execution context
 * @param confirmationPrompt - Optional confirmation message for destructive operations
 * @returns Result of execution or dry-run simulation
 */
export async function executeWithDryRun<T extends { dryRun?: boolean }, R>(
  options: T,
  executeFn: (config: T) => Promise<Result<R, CoreError>>,
  context: CommandContext,
  confirmationPrompt?: string
): Promise<Result<R, CoreError>> {
  if (options.dryRun) {
    context.logger.info('🔍 DRY RUN MODE - No changes will be made')
    context.logger.info('The following operations would be performed:')
    context.logger.info('')

    // Execute in dry-run mode (implementation should handle this flag)
    const result = await executeFn(options)

    if (result.isOk()) {
      context.logger.info('')
      context.logger.info('✨ Dry run completed - no actual changes were made')
      context.logger.info('Remove --dry-run flag to perform actual operations')
    }

    return result
  }

  // Handle confirmation for destructive operations
  if (confirmationPrompt && !context.args.includes('--force')) {
    const { confirm } = await import('@inquirer/prompts')

    try {
      const shouldProceed = await confirm({
        message: confirmationPrompt,
        default: false,
      })

      if (!shouldProceed) {
        context.logger.info('Operation cancelled by user')
        return err(
          createCoreError('USER_CANCELLED', 'CLI_ERROR', 'Operation cancelled by user', {
            recoverable: true,
          })
        )
      }
    } catch (error) {
      return err(
        createCoreError('CONFIRMATION_ERROR', 'CLI_ERROR', 'Failed to get user confirmation', {
          recoverable: true,
          cause: error,
        })
      )
    }
  }

  // Execute normally
  return executeFn(options)
}

/**
 * Display formatted summary of results
 *
 * Shows a nicely formatted summary with title, key-value pairs, and optional
 * statistics. Uses colors and styling for professional CLI appearance.
 *
 * Used to display transformation configuration and results.
 *
 * @param title - Main title for the summary
 * @param items - Array of label-value pairs to display
 * @param context - Command execution context for logging
 * @param stats - Optional statistics to display at the end
 */
export function displaySummary(
  title: string,
  items: Array<{ label: string; value: string | number | boolean }>,
  context: CommandContext,
  stats?: Array<{ label: string; value: string | number }>
): void {
  context.logger.info('')
  context.logger.info(chalk.bold.blue(`📋 ${title}`))
  context.logger.info(chalk.blue('═'.repeat(title.length + 4)))

  // Display main items
  for (const item of items) {
    const formattedValue =
      typeof item.value === 'boolean'
        ? item.value
          ? chalk.green('✓ Yes')
          : chalk.red('✗ No')
        : chalk.cyan(String(item.value))

    context.logger.info(`${chalk.gray('▸')} ${chalk.white(item.label)}: ${formattedValue}`)
  }

  // Display statistics if provided
  if (stats && stats.length > 0) {
    context.logger.info('')
    context.logger.info(chalk.bold.yellow('📊 Statistics'))
    context.logger.info(chalk.yellow('─'.repeat(12)))

    for (const stat of stats) {
      context.logger.info(
        `${chalk.gray('▸')} ${chalk.white(stat.label)}: ${chalk.green(String(stat.value))}`
      )
    }
  }

  context.logger.info('')
}
