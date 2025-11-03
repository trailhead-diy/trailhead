import type { Command, CommandContext } from '../command/index.js'
import type { Result, CoreError } from '@trailhead/core'
import { createTestContext } from './context.js'

/**
 * Run a CLI command with options and context
 *
 * Executes a command with the provided options and optional test context.
 * Useful for testing command execution in isolation.
 *
 * @template T - Command options type
 * @param command - Command to execute
 * @param options - Command options/arguments
 * @param context - Optional test context (creates default if not provided)
 * @returns Result of command execution
 *
 * @example
 * ```typescript
 * const result = await runCommand(myCommand, {
 *   verbose: true,
 *   output: 'test.json'
 * });
 * expect(result.isOk()).toBe(true);
 * ```
 */
export async function runCommand<T>(
  command: Command<T>,
  options: T,
  context?: CommandContext
): Promise<Result<void, CoreError>> {
  const testContext = context ?? createTestContext()
  return command.execute(options, testContext)
}

/**
 * Command test runner state
 */
export interface CommandTestRunnerState<T> {
  readonly context: CommandContext
  readonly command: Command<T>
}

/**
 * Create a stateful command test runner
 *
 * Creates a test runner that maintains context across multiple command
 * executions. Useful for testing sequences of commands or verifying
 * state changes.
 *
 * @template T - Command options type
 * @param command - Command to test
 * @param context - Optional custom test context
 * @returns Test runner state with command and context
 *
 * @example
 * ```typescript
 * const runner = createCommandTestRunner(buildCommand);
 * await runTestCommand(runner, { target: 'src' });
 * const files = getTestFiles(runner);
 * expect(files.has('dist/output.js')).toBe(true);
 * ```
 */
export function createCommandTestRunner<T>(
  command: Command<T>,
  context?: CommandContext
): CommandTestRunnerState<T> {
  return {
    command,
    context: context ?? createTestContext(),
  }
}

/**
 * Run command using test runner state
 *
 * Executes a command using the context from a test runner,
 * maintaining state across multiple executions.
 *
 * @template T - Command options type
 * @param state - Test runner state
 * @param options - Command options
 * @returns Result of command execution
 *
 * @example
 * ```typescript
 * const runner = createCommandTestRunner(command);
 * const result = await runTestCommand(runner, { verbose: true });
 * ```
 */
export async function runTestCommand<T>(
  state: CommandTestRunnerState<T>,
  options: T
): Promise<Result<void, CoreError>> {
  return state.command.execute(options, state.context)
}

/**
 * Run command and assert successful execution
 *
 * Executes a command and throws if it fails. Useful for test
 * cases where command must succeed.
 *
 * @template T - Command options type
 * @param state - Test runner state
 * @param options - Command options
 * @throws {Error} When command execution fails
 *
 * @example
 * ```typescript
 * const runner = createCommandTestRunner(command);
 * await runTestCommandExpectSuccess(runner, {
 *   input: 'valid-file.json'
 * });
 * // Throws if command fails
 * ```
 */
export async function runTestCommandExpectSuccess<T>(
  state: CommandTestRunnerState<T>,
  options: T
): Promise<void> {
  const result = await runTestCommand(state, options)
  if (result.isErr()) {
    throw new Error(`Command failed: ${result.error.message}`)
  }
}

/**
 * Run command and assert it fails with expected error
 *
 * Executes a command expecting failure, optionally verifying
 * the specific error code. Useful for testing error handling.
 *
 * @template T - Command options type
 * @param state - Test runner state
 * @param options - Command options
 * @param errorCode - Optional expected error code
 * @throws {Error} When command succeeds or has wrong error code
 *
 * @example
 * ```typescript
 * const runner = createCommandTestRunner(command);
 * await runTestCommandExpectError(runner, {
 *   input: 'missing-file.json'
 * }, 'FILE_NOT_FOUND');
 * ```
 */
export async function runTestCommandExpectError<T>(
  state: CommandTestRunnerState<T>,
  options: T,
  errorCode?: string
): Promise<void> {
  const result = await runTestCommand(state, options)
  if (result.isOk()) {
    throw new Error('Expected command to fail, but it succeeded')
  }
  if (errorCode && result.error.type !== errorCode) {
    throw new Error(`Expected error code ${errorCode}, but got ${result.error.type}`)
  }
}

/**
 * Get test context from runner state
 *
 * Retrieves the command context for accessing logger, filesystem,
 * and other context properties.
 *
 * @template T - Command options type
 * @param state - Test runner state
 * @returns Command context from runner
 *
 * @example
 * ```typescript
 * const runner = createCommandTestRunner(command);
 * const context = getTestContext(runner);
 * expect(context.projectRoot).toBe('/test');
 * ```
 */
export function getTestContext<T>(state: CommandTestRunnerState<T>): CommandContext {
  return state.context
}

/**
 * Get files from test runner's virtual filesystem
 *
 * Retrieves all files written during test execution when using
 * a mock filesystem. Returns undefined if not using mock fs.
 *
 * @template T - Command options type
 * @param state - Test runner state
 * @returns Map of file paths to contents, or undefined
 *
 * @example
 * ```typescript
 * const runner = createCommandTestRunner(command);
 * await runTestCommand(runner, { output: 'result.json' });
 * const files = getTestFiles(runner);
 * expect(files?.get('result.json')).toContain('success');
 * ```
 */
export function getTestFiles<T>(state: CommandTestRunnerState<T>): Map<string, string> | undefined {
  const fs = state.context.fs as any
  return fs.getFiles?.()
}

/**
 * Get captured logs from test runner
 *
 * Retrieves all log messages captured during test execution
 * when using a mock logger. Returns undefined if not capturing.
 *
 * @template T - Command options type
 * @param state - Test runner state
 * @returns Array of log entries with level and message
 *
 * @example
 * ```typescript
 * const runner = createCommandTestRunner(command);
 * await runTestCommand(runner, { verbose: true });
 * const logs = getTestLogs(runner);
 * expect(logs).toContainEqual({
 *   level: 'info',
 *   message: 'Operation completed'
 * });
 * ```
 */
export function getTestLogs<T>(
  state: CommandTestRunnerState<T>
): Array<{ level: string; message: string }> | undefined {
  const logger = state.context.logger as any
  return logger.logs
}
