import type { Command, CommandContext } from '../command/index.js';
import type { Result } from 'neverthrow';
import type { TrailheadError } from '@trailhead/core';
import { createTestContext } from './context.js';

/**
 * Run command with options and context
 */
export async function runCommand<T>(
  command: Command<T>,
  options: T,
  context?: CommandContext
): Promise<Result<void, TrailheadError>> {
  const testContext = context ?? createTestContext();
  return command.execute(options, testContext);
}

/**
 * Command test runner state
 */
export interface CommandTestRunnerState<T> {
  readonly context: CommandContext;
  readonly command: Command<T>;
}

/**
 * Create command test runner
 */
export function createCommandTestRunner<T>(
  command: Command<T>,
  context?: CommandContext
): CommandTestRunnerState<T> {
  return {
    command,
    context: context ?? createTestContext(),
  };
}

/**
 * Run command with test runner
 */
export async function runTestCommand<T>(
  state: CommandTestRunnerState<T>,
  options: T
): Promise<Result<void, TrailheadError>> {
  return state.command.execute(options, state.context);
}

/**
 * Run command expecting success
 */
export async function runTestCommandExpectSuccess<T>(
  state: CommandTestRunnerState<T>,
  options: T
): Promise<void> {
  const result = await runTestCommand(state, options);
  if (result.isErr()) {
    throw new Error(`Command failed: ${result.error.message}`);
  }
}

/**
 * Run command expecting error
 */
export async function runTestCommandExpectError<T>(
  state: CommandTestRunnerState<T>,
  options: T,
  errorCode?: string
): Promise<void> {
  const result = await runTestCommand(state, options);
  if (result.isOk()) {
    throw new Error('Expected command to fail, but it succeeded');
  }
  if (errorCode && result.error.type !== errorCode) {
    throw new Error(`Expected error code ${errorCode}, but got ${result.error.type}`);
  }
}

/**
 * Get test context from runner
 */
export function getTestContext<T>(state: CommandTestRunnerState<T>): CommandContext {
  return state.context;
}

/**
 * Get files from test runner filesystem
 */
export function getTestFiles<T>(state: CommandTestRunnerState<T>): Map<string, string> | undefined {
  const fs = state.context.fs as any;
  return fs.getFiles?.();
}

/**
 * Get logs from test runner logger
 */
export function getTestLogs<T>(
  state: CommandTestRunnerState<T>
): Array<{ level: string; message: string }> | undefined {
  const logger = state.context.logger as any;
  return logger.logs;
}
