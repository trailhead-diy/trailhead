import type { CommandContext } from '../command/index.js'
// @ts-expect-error - Domain package types will be available after build
import type { FileSystem } from '@esteban-url/fs'
import type { Logger } from '../utils/logger.js'
import { createMockFileSystem } from '@esteban-url/fs/testing'
// import { mockLogger } from './mocks.js' // Temporarily disabled

export interface TestContextOptions {
  projectRoot?: string
  filesystem?: FileSystem
  logger?: Logger
  verbose?: boolean
  args?: string[]
}

/**
 * Create a test context for command testing
 */
export function createTestContext(options: TestContextOptions = {}): CommandContext {
  return {
    projectRoot: options.projectRoot ?? '/test/project',
    logger:
      options.logger ??
      ({ info: () => {}, error: () => {}, debug: () => {}, warn: () => {} } as any),
    verbose: options.verbose ?? false,
    fs: options.filesystem ?? createMockFileSystem(),
    args: options.args ?? [],
  }
}

/**
 * Create a test context with specific files
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
