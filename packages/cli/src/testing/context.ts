import type { CommandContext, ParsedArgs } from '../command/types.js'
import { ok, err, createCoreError } from '@trailhead/core'
import type { Result, CoreError } from '@trailhead/core'

/**
 * Mock logger for testing
 */
export interface MockLogger {
  info: (message: string) => void
  warning: (message: string) => void
  error: (message: string) => void
  debug: (message: string) => void
  success: (message: string) => void
  step: (message: string) => void
  logs: Array<{ level: string; message: string }>
}

/**
 * Create a mock logger that captures log calls
 */
export function createMockLogger(): MockLogger {
  const logs: Array<{ level: string; message: string }> = []

  return {
    info: (message: string) => logs.push({ level: 'info', message }),
    warning: (message: string) => logs.push({ level: 'warning', message }),
    error: (message: string) => logs.push({ level: 'error', message }),
    debug: (message: string) => logs.push({ level: 'debug', message }),
    success: (message: string) => logs.push({ level: 'success', message }),
    step: (message: string) => logs.push({ level: 'step', message }),
    logs,
  }
}

/**
 * Create a mock filesystem for testing
 */
export function createMockFileSystem() {
  const files = new Map<string, string>()

  return {
    readFile: async (path: string): Promise<Result<string, CoreError>> => {
      const content = files.get(path)
      if (content === undefined) {
        return err(
          createCoreError('FILE_NOT_FOUND', 'FS_ERROR', `File not found: ${path}`, {
            recoverable: false,
          })
        )
      }
      return ok(content)
    },

    writeFile: async (path: string, content: string): Promise<Result<void, CoreError>> => {
      files.set(path, content)
      return ok(undefined)
    },

    exists: async (path: string): Promise<Result<boolean, CoreError>> => {
      return ok(files.has(path))
    },

    // Test helper: add file to mock fs
    __setFile: (path: string, content: string) => {
      files.set(path, content)
    },

    // Test helper: get all files
    __getAllFiles: () => new Map(files),
  }
}

/**
 * Create a mock CommandContext for testing
 *
 * @param overrides - Partial context to override defaults
 * @returns Mock CommandContext for testing
 *
 * @example
 * ```typescript
 * const context = createMockContext({
 *   args: { _: ['file.txt'], input: 'file.txt' },
 *   verbose: true
 * })
 *
 * const result = await myCommand.run(context.args, context)
 * ```
 */
export function createMockContext(
  overrides: Partial<CommandContext> = {}
): CommandContext & { logger: MockLogger } {
  const logger = createMockLogger()
  const fs = createMockFileSystem()

  const defaultArgs: ParsedArgs = { _: [] }

  return {
    projectRoot: overrides.projectRoot || process.cwd(),
    logger: (overrides.logger as MockLogger) || logger,
    verbose: overrides.verbose ?? false,
    fs: (overrides.fs as any) || fs,
    args: overrides.args || defaultArgs,
  }
}
