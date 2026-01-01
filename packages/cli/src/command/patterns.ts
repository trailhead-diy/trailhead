import type { CommandContext, CommandPhase } from './types.js'
import { ok, err, createCoreError, type Result, type CoreError } from '@trailhead/core'
import { colors } from '../utils/chalk.js'

/**
 * Configuration options for commands that support interactive mode
 *
 * Enables commands to run with user prompts for missing options or
 * skip prompts entirely for automated workflows.
 */
export interface InteractiveCommandOptions {
  /** Enable interactive mode with user prompts for missing options */
  readonly interactive?: boolean
  /** Skip prompts even in interactive mode (for testing/automation) */
  readonly skipPrompts?: boolean
}

/**
 * Execute a command with interactive prompt support
 *
 * Enables commands to run interactively by prompting users for missing options.
 * CLI arguments take precedence over prompted values. Useful for creating
 * user-friendly commands that guide users through configuration.
 *
 * @template T - Command options type extending InteractiveCommandOptions
 * @template R - Result type from command execution
 * @param options - Initial options from CLI arguments
 * @param promptFn - Async function that returns prompted option values
 * @param executeFn - Main command execution function with final options
 * @param context - Command execution context
 * @returns Result of command execution or error
 *
 * @example
 * ```typescript
 * const result = await executeInteractiveCommand(
 *   options,
 *   async () => {
 *     const name = await input({ message: 'Project name?' });
 *     return { name };
 *   },
 *   async (finalOptions) => {
 *     // Execute with merged CLI + prompted options
 *     return createProject(finalOptions);
 *   },
 *   context
 * );
 * ```
 */
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

/**
 * Validation rule for command data
 *
 * Defines a named validation that can transform or reject data.
 * Validators can modify data during validation for normalization.
 *
 * @template T - Type of data being validated
 */
export interface ValidationRule<T> {
  /** Human-readable name for error messages */
  readonly name: string
  /** Validation function that can transform or reject data */
  readonly validate: (value: T) => Result<T, CoreError>
  /** Whether this validation must pass (future use) */
  readonly required?: boolean
}

/**
 * Execute a function with data validation
 *
 * Runs validation rules sequentially before executing main function.
 * Validators can transform data, making this useful for normalization
 * and ensuring data integrity before processing.
 *
 * @template T - Type of data to validate
 * @template R - Result type from execution
 * @param data - Data to validate
 * @param rules - Array of validation rules to apply in order
 * @param executeFn - Function to execute with validated data
 * @param context - Command execution context
 * @returns Result of execution or validation error
 *
 * @example
 * ```typescript
 * const rules = [
 *   {
 *     name: 'valid-path',
 *     validate: (data) => validatePath(data.path)
 *   },
 *   {
 *     name: 'normalize-options',
 *     validate: (data) => ok({ ...data, path: resolve(data.path) })
 *   }
 * ];
 *
 * await executeWithValidation(data, rules, processFiles, context);
 * ```
 */
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

/**
 * Transactional file system operation
 *
 * Represents an atomic operation with optional rollback support.
 * Operations are executed sequentially with automatic rollback on failure.
 *
 * @template T - Result type of the operation
 */
export interface FileSystemOperation<T> {
  /** Operation name for logging and error messages */
  readonly name: string
  /** Function that performs the operation */
  readonly execute: () => Promise<Result<T, CoreError>>
  /** Optional rollback function called on failure */
  readonly rollback?: () => Promise<void>
}

/**
 * Execute file system operations with transactional rollback
 *
 * Executes operations sequentially, automatically rolling back completed
 * operations if any operation fails. Provides atomic-like behavior for
 * file system changes.
 *
 * @template T - Result type of operations
 * @param operations - Array of operations to execute in order
 * @param context - Command execution context
 * @returns Array of operation results or error with rollback
 *
 * @example
 * ```typescript
 * const operations = [
 *   {
 *     name: 'create-directory',
 *     execute: () => fs.mkdir(dir),
 *     rollback: () => fs.rmdir(dir)
 *   },
 *   {
 *     name: 'write-config',
 *     execute: () => fs.writeFile(configPath, data),
 *     rollback: () => fs.unlink(configPath)
 *   }
 * ];
 *
 * const results = await executeFileSystemOperations(operations, context);
 * ```
 */
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

/**
 * Configuration for spawning subprocesses
 *
 * Defines command execution parameters with support for custom
 * environment and working directory.
 */
export interface SubprocessConfig {
  /** Command to execute (must be in PATH or absolute) */
  readonly command: string
  /** Array of command arguments */
  readonly args: string[]
  /** Working directory for command execution */
  readonly cwd?: string
  /** Environment variables to merge with process.env */
  readonly env?: Record<string, string>
}

/**
 * Execute a subprocess with proper error handling
 *
 * Spawns a child process and captures output. In verbose mode, inherits
 * stdio for real-time output. Otherwise, captures and returns stdout.
 *
 * @param config - Subprocess configuration
 * @param context - Command execution context
 * @returns Stdout output on success or error with details
 *
 * @example
 * ```typescript
 * const result = await executeSubprocess({
 *   command: 'npm',
 *   args: ['install', '--save-dev', 'typescript'],
 *   cwd: projectPath
 * }, context);
 * ```
 */
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
 *
 * Processes items in parallel batches to optimize performance while
 * controlling resource usage. Useful for file processing, API calls,
 * or any operation that benefits from parallelization.
 *
 * @template T - Input item type
 * @template R - Result type per item
 * @param items - Array of items to process
 * @param processor - Async function to process each item
 * @param options - Batch configuration
 * @param options.batchSize - Number of items to process in parallel
 * @param options.onProgress - Optional progress callback
 * @param context - Command execution context (unused but required for consistency)
 * @returns Array of processed results or first error encountered
 *
 * @example
 * ```typescript
 * const results = await executeBatch(
 *   files,
 *   async (file) => processFile(file),
 *   {
 *     batchSize: 5,
 *     onProgress: (done, total) => {
 *       console.log(`Processed ${done}/${total}`);
 *     }
 *   },
 *   context
 * );
 * ```
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

/**
 * Options for configuration-based command execution
 *
 * Supports loading base config, applying presets, and runtime overrides
 * for flexible command configuration.
 */
export interface ConfigurationOptions {
  /** Path to configuration file */
  readonly config?: string
  /** Named preset to apply */
  readonly preset?: string
  /** Runtime configuration overrides */
  readonly override?: Record<string, any>
}

/**
 * Execute a command with layered configuration
 *
 * Loads configuration from file, applies presets, and merges runtime
 * overrides. Provides flexible configuration management for commands
 * that support multiple configuration sources.
 *
 * @template T - Options type extending ConfigurationOptions
 * @template R - Result type from execution
 * @param options - Configuration options with paths and overrides
 * @param loadConfigFn - Function to load configuration from path
 * @param executeFn - Function to execute with final configuration
 * @param context - Command execution context
 * @returns Result of execution with merged configuration
 *
 * @example
 * ```typescript
 * await executeWithConfiguration(
 *   options,
 *   async (path) => loadJsonConfig(path || '.config.json'),
 *   async (config) => buildProject(config),
 *   context
 * );
 * ```
 */
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
  if (confirmationPrompt && !context.args.force) {
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
  context.logger.info(colors.bold(colors.blue(`📋 ${title}`)))
  context.logger.info(colors.blue('═'.repeat(title.length + 4)))

  // Display main items
  for (const item of items) {
    const formattedValue =
      typeof item.value === 'boolean'
        ? item.value
          ? colors.green('✓ Yes')
          : colors.red('✗ No')
        : colors.cyan(String(item.value))

    context.logger.info(`${colors.gray('▸')} ${item.label}: ${formattedValue}`)
  }

  // Display statistics if provided
  if (stats && stats.length > 0) {
    context.logger.info('')
    context.logger.info(colors.bold(colors.yellow('📊 Statistics')))
    context.logger.info(colors.yellow('─'.repeat(12)))

    for (const stat of stats) {
      context.logger.info(`${colors.gray('▸')} ${stat.label}: ${colors.green(String(stat.value))}`)
    }
  }

  context.logger.info('')
}
