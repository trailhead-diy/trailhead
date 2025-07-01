import type { CommandContext } from './base.js';
import type { Result } from '../core/errors/types.js';
import { Ok, Err } from '../core/errors/factory.js';

export interface InteractiveCommandOptions {
  readonly interactive?: boolean;
  readonly skipPrompts?: boolean;
}

export async function executeInteractiveCommand<
  T extends InteractiveCommandOptions,
  R,
>(
  options: T,
  promptFn: () => Promise<Partial<T>>,
  executeFn: (finalOptions: T) => Promise<Result<R>>,
  context: CommandContext,
): Promise<Result<R>> {
  let finalOptions = options;

  // Run interactive prompts if needed
  if (options.interactive && !options.skipPrompts) {
    context.logger.info('Running in interactive mode...');

    try {
      const promptResults = await promptFn();
      // Merge prompt results with CLI options (CLI takes precedence)
      finalOptions = { ...promptResults, ...options } as T;
    } catch (error) {
      return Err({
        code: 'PROMPT_ERROR',
        message: 'Interactive prompts failed',
        cause: error,
        recoverable: true,
      });
    }
  }

  // Execute with final options
  return executeFn(finalOptions);
}

export interface ValidationRule<T> {
  readonly name: string;
  readonly validate: (value: T) => Result<T>;
  readonly required?: boolean;
}

export async function executeWithValidation<T, R>(
  data: T,
  rules: ValidationRule<T>[],
  executeFn: (validData: T) => Promise<Result<R>>,
  context: CommandContext,
): Promise<Result<R>> {
  // Run validation rules
  for (const rule of rules) {
    const result = rule.validate(data);

    if (!result.success) {
      context.logger.error(`Validation failed: ${rule.name}`);
      return result as any; // Type narrowing
    }

    // Update data if validator transformed it
    data = result.value;
  }

  context.logger.debug('All validations passed');
  return executeFn(data);
}

export interface FileSystemOperation<T> {
  readonly name: string;
  readonly execute: () => Promise<Result<T>>;
  readonly rollback?: () => Promise<void>;
}

export async function executeFileSystemOperations<T>(
  operations: FileSystemOperation<T>[],
  context: CommandContext,
): Promise<Result<T[]>> {
  const results: T[] = [];
  const completedOps: FileSystemOperation<T>[] = [];

  for (const op of operations) {
    context.logger.debug(`Executing: ${op.name}`);

    try {
      const result = await op.execute();

      if (!result.success) {
        // Rollback completed operations
        if (completedOps.length > 0) {
          context.logger.warning('Rolling back changes...');

          for (const completedOp of completedOps.reverse()) {
            if (completedOp.rollback) {
              try {
                await completedOp.rollback();
                context.logger.debug(`Rolled back: ${completedOp.name}`);
              } catch (_error) {
                context.logger.error(`Failed to rollback: ${completedOp.name}`);
              }
            }
          }
        }

        return result as any;
      }

      results.push(result.value);
      completedOps.push(op);
    } catch (error) {
      return Err({
        code: 'OPERATION_ERROR',
        message: `Operation failed: ${op.name}`,
        cause: error,
        recoverable: false,
      });
    }
  }

  return Ok(results);
}

export interface SubprocessConfig {
  readonly command: string;
  readonly args: string[];
  readonly cwd?: string;
  readonly env?: Record<string, string>;
}

export async function executeSubprocess(
  config: SubprocessConfig,
  context: CommandContext,
): Promise<Result<string>> {
  const { spawn } = await import('child_process');
  const { command, args, cwd, env } = config;

  return new Promise((resolve) => {
    context.logger.debug(`Spawning: ${command} ${args.join(' ')}`);

    const child = spawn(command, args, {
      cwd: cwd ?? process.cwd(),
      env: { ...process.env, ...env },
      stdio: context.verbose ? 'inherit' : 'pipe',
    });

    let stdout = '';
    let stderr = '';

    if (!context.verbose) {
      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });
      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
    }

    child.on('error', (error) => {
      resolve(
        Err({
          code: 'SUBPROCESS_ERROR',
          message: `Failed to spawn ${command}`,
          cause: error,
          recoverable: false,
        }),
      );
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(Ok(stdout));
      } else {
        resolve(
          Err({
            code: 'SUBPROCESS_EXIT_ERROR',
            message: `${command} exited with code ${code}`,
            details: stderr || undefined,
            recoverable: false,
          }),
        );
      }
    });
  });
}

/**
 * Execute operations in batches with concurrency control
 */
export async function executeBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<Result<R>>,
  options: {
    batchSize: number;
    onProgress?: (completed: number, total: number) => void;
  },
  _context: CommandContext,
): Promise<Result<R[]>> {
  const results: R[] = [];
  const { batchSize, onProgress } = options;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    // Process batch in parallel
    const batchPromises = batch.map((item) => processor(item));
    const batchResults = await Promise.all(batchPromises);

    // Check for failures
    for (const result of batchResults) {
      if (!result.success) {
        return result as any;
      }
      results.push(result.value);
    }

    // Report progress
    if (onProgress) {
      onProgress(Math.min(i + batchSize, items.length), items.length);
    }
  }

  return Ok(results);
}

export interface ConfigurationOptions {
  readonly config?: string;
  readonly preset?: string;
  readonly override?: Record<string, any>;
}

export async function executeWithConfiguration<
  T extends ConfigurationOptions,
  R,
>(
  options: T,
  loadConfigFn: (path?: string) => Promise<Result<Record<string, any>>>,
  executeFn: (config: Record<string, any>) => Promise<Result<R>>,
  context: CommandContext,
): Promise<Result<R>> {
  // Load base configuration
  const configResult = await loadConfigFn(options.config);
  if (!configResult.success) {
    return configResult as any;
  }

  let config = configResult.value;

  // Apply preset if specified
  if (options.preset) {
    context.logger.debug(`Applying preset: ${options.preset}`);
    // Preset logic would go here
  }

  // Apply overrides
  if (options.override) {
    config = { ...config, ...options.override };
  }

  return executeFn(config);
}
