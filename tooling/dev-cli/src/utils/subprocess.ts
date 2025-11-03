import {
  executeSubprocess,
  type SubprocessConfig,
  type CommandContext,
} from '@trailhead/cli/command'
import { ok, err, createCoreError, type Result, type CoreError } from '@trailhead/core'

export interface ExecutionOptions {
  readonly cwd?: string
  readonly env?: Record<string, string>
  readonly timeout?: number
  readonly allowFailure?: boolean
}

/**
 * Execute a shell command with enhanced error handling, timeout support, and logging
 */
export async function execCommand(
  command: string,
  args: string[],
  context: CommandContext,
  options: ExecutionOptions = {}
): Promise<Result<string, CoreError>> {
  const config: SubprocessConfig = {
    command,
    args,
    cwd: options.cwd,
    env: options.env,
  }

  // If timeout is specified, wrap the execution with a timeout check
  if (options.timeout && options.timeout > 0) {
    const timeoutPromise = new Promise<Result<string, CoreError>>((_, reject) => {
      setTimeout(() => {
        reject(
          err(
            createCoreError(
              'COMMAND_TIMEOUT',
              'SUBPROCESS_ERROR',
              `Command timed out after ${options.timeout}ms: ${command} ${args.join(' ')}`,
              {
                recoverable: false,
                suggestion: 'Increase timeout or check if the command is stuck',
              }
            )
          )
        )
      }, options.timeout)
    })

    try {
      const result = await Promise.race([executeSubprocess(config, context), timeoutPromise])

      if (result.isErr() && !options.allowFailure) {
        return err(
          createCoreError(
            'COMMAND_EXECUTION_FAILED',
            'SUBPROCESS_ERROR',
            `Command failed: ${command} ${args.join(' ')}`,
            {
              recoverable: false,
              cause: result.error,
              suggestion: 'Check command syntax and ensure all dependencies are installed',
            }
          )
        )
      }

      return result
    } catch (error) {
      // This catches the timeout rejection
      if (error && typeof error === 'object' && 'isErr' in error) {
        return error as Result<string, CoreError>
      }
      throw error
    }
  }

  // No timeout specified, execute normally
  const result = await executeSubprocess(config, context)

  if (result.isErr() && !options.allowFailure) {
    return err(
      createCoreError(
        'COMMAND_EXECUTION_FAILED',
        'SUBPROCESS_ERROR',
        `Command failed: ${command} ${args.join(' ')}`,
        {
          recoverable: false,
          cause: result.error,
          suggestion: 'Check command syntax and ensure all dependencies are installed',
        }
      )
    )
  }

  return result
}

/**
 * Execute multiple commands in sequence, stopping on first failure
 */
export async function execSequence(
  commands: Array<{ command: string; args: string[]; options?: ExecutionOptions }>,
  context: CommandContext
): Promise<Result<string[], CoreError>> {
  const results: string[] = []

  for (const { command, args, options = {} } of commands) {
    const result = await execCommand(command, args, context, options)

    if (result.isErr()) {
      return err(result.error)
    }

    results.push(result.value)
  }

  return ok(results)
}

/**
 * Execute commands in parallel
 */
export async function execParallel(
  commands: Array<{ command: string; args: string[]; options?: ExecutionOptions }>,
  context: CommandContext
): Promise<Result<string[], CoreError>> {
  const promises = commands.map(({ command, args, options = {} }) =>
    execCommand(command, args, context, options)
  )

  const results = await Promise.allSettled(promises)
  const outputs: string[] = []

  for (const result of results) {
    if (result.status === 'rejected') {
      return err(
        createCoreError(
          'PARALLEL_EXECUTION_FAILED',
          'SUBPROCESS_ERROR',
          'One or more parallel commands failed',
          {
            recoverable: false,
            cause: result.reason,
          }
        )
      )
    }

    if (result.value.isErr()) {
      return err(result.value.error)
    }

    outputs.push(result.value.value)
  }

  return ok(outputs)
}

/**
 * Timer utilities for measuring execution time (functional approach)
 */
export const createTimer = () => Date.now()

export const getElapsedSeconds = (startTime: number): number =>
  Math.floor((Date.now() - startTime) / 1000)

export const measureExecution = async <T>(fn: () => Promise<T>): Promise<[T, number]> => {
  const startTime = createTimer()
  const result = await fn()
  const elapsed = getElapsedSeconds(startTime)
  return [result, elapsed]
}
