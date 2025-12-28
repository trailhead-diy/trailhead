import type { CommandContext } from '../command/index.js'
import type { Logger } from '../utils/logger.js'
import { createMockFileSystem } from '../fs/testing/index.js'

/**
 * Create a no-op logger for testing
 *
 * Returns a logger that silently discards all messages.
 * Useful for testing without console noise.
 */
export function createNoopLogger(): Logger {
  return {
    info: () => {},
    success: () => {},
    warning: () => {},
    error: () => {},
    debug: () => {},
    step: () => {},
  }
}

/**
 * Options for creating test command contexts
 *
 * Allows customization of all context properties for testing
 * different scenarios and command behaviors.
 */
export interface TestContextOptions {
  /** Project root directory path (default: '/test/project') */
  projectRoot?: string
  /** Custom filesystem implementation (default: mock filesystem) */
  filesystem?: any
  /** Custom logger implementation (default: no-op logger) */
  logger?: Logger
  /** Whether verbose mode is enabled */
  verbose?: boolean
  /** Command line arguments array */
  args?: string[]
}

/**
 * Create a test context for command testing
 *
 * Creates a command context suitable for testing with sensible defaults.
 * Uses mock filesystem and no-op logger by default to isolate tests.
 *
 * @param options - Context configuration options
 * @returns Command context for testing
 *
 * @example
 * ```typescript
 * const context = createTestContext({
 *   verbose: true,
 *   args: ['input.json', '--format', 'yaml']
 * });
 *
 * const result = await command.execute(options, context);
 * ```
 */
export function createTestContext(options: TestContextOptions = {}): CommandContext {
  return {
    projectRoot: options.projectRoot ?? '/test/project',
    logger: options.logger ?? createNoopLogger(),
    verbose: options.verbose ?? false,
    fs: options.filesystem ?? createMockFileSystem(),
    args: options.args ?? [],
  }
}

/**
 * Create a test context with pre-populated files
 *
 * Convenience function that creates a test context with a mock
 * filesystem containing the specified files. Useful for testing
 * commands that read input files.
 *
 * @param files - Map of file paths to contents
 * @param options - Additional context options
 * @returns Command context with mock filesystem
 *
 * @example
 * ```typescript
 * const context = createTestContextWithFiles({
 *   'config.json': JSON.stringify({ name: 'test' }),
 *   'src/index.ts': 'export const value = 42;'
 * });
 *
 * const result = await processCommand.execute({ input: 'config.json' }, context);
 * ```
 */
export function createTestContextWithFiles(
  files: Record<string, string>,
  options: TestContextOptions = {}
): CommandContext {
  return createTestContext({
    ...options,
    filesystem: createMockFileSystem(files),
  })
}
