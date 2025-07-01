import type { CommandContext } from '../command/index.js';
import type { FileSystem } from '../filesystem/index.js';
import type { Logger } from '../core/index.js';
import { mockFileSystem, mockLogger } from './mocks.js';

export interface TestContextOptions {
  projectRoot?: string;
  filesystem?: FileSystem;
  logger?: Logger;
  verbose?: boolean;
  args?: string[];
}

/**
 * Create a test context for command testing
 */
export function createTestContext(
  options: TestContextOptions = {},
): CommandContext {
  return {
    projectRoot: options.projectRoot ?? '/test/project',
    logger: options.logger ?? mockLogger(),
    verbose: options.verbose ?? false,
    fs: options.filesystem ?? mockFileSystem(),
    args: options.args ?? [],
  };
}

/**
 * Create a test context with specific files
 */
export function createTestContextWithFiles(
  files: Record<string, string>,
  options: TestContextOptions = {},
): CommandContext {
  return createTestContext({
    ...options,
    filesystem: mockFileSystem(files),
  });
}
