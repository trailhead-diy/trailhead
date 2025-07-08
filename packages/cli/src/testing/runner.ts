import type { Command, CommandContext } from '../command/index.js';
import type { Result } from '../core/errors/index.js';
import { createTestContext } from './context.js';

export async function runCommand<T>(
  command: Command<T>,
  options: T,
  context?: CommandContext
): Promise<Result<void>> {
  const testContext = context ?? createTestContext();
  return command.execute(options, testContext);
}

export class CommandTestRunner<T> {
  private context: CommandContext;
  private command: Command<T>;

  constructor(command: Command<T>, context?: CommandContext) {
    this.command = command;
    this.context = context ?? createTestContext();
  }

  async run(options: T): Promise<Result<void>> {
    return this.command.execute(options, this.context);
  }

  async runExpectSuccess(options: T): Promise<void> {
    const result = await this.run(options);
    if (!result.success) {
      throw new Error(`Command failed: ${result.error.message}`);
    }
  }

  async runExpectError(options: T, errorCode?: string): Promise<void> {
    const result = await this.run(options);
    if (result.success) {
      throw new Error('Expected command to fail, but it succeeded');
    }
    if (errorCode && result.error.code !== errorCode) {
      throw new Error(`Expected error code ${errorCode}, but got ${result.error.code}`);
    }
  }

  getContext(): CommandContext {
    return this.context;
  }

  getFiles(): Map<string, string> | undefined {
    const fs = this.context.fs as any;
    return fs.getFiles?.();
  }

  getLogs(): Array<{ level: string; message: string }> | undefined {
    const logger = this.context.logger as any;
    return logger.logs;
  }
}
