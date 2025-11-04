/**
 * Foundation CLI orchestrator for the Trailhead System providing a complete CLI framework.
 *
 * This package provides a modern foundation for CLI applications using functional programming patterns,
 * explicit error handling with Result types, and comprehensive command management. Built on top of
 * Commander.js with enhanced type safety and validation.
 *
 * @example
 * ```typescript
 * import { createCLI, createCommand } from '@trailhead/cli'
 *
 * const testCommand = createCommand({
 *   name: 'test',
 *   description: 'Run tests',
 *   action: async (options, context) => {
 *     context.logger.info('Running tests...');
 *     return ok(undefined);
 *   }
 * });
 *
 * const cli = createCLI({
 *   name: 'my-cli',
 *   version: '1.0.0',
 *   description: 'My CLI application',
 *   commands: [testCommand]
 * });
 *
 * await cli.run();
 * ```
 *
 * @packageDocumentation
 * @module @trailhead/cli
 * @since 0.1.0
 */

// Core Result types from foundation package
export { ok, err } from '@trailhead/core'
export type { Result, CoreError } from '@trailhead/core'

// Primary CLI creation API - the core of this package
export { createCLI } from './cli.js'
export type { CLI, CLIConfig } from './cli.js'

// Command creation API - for building individual commands
export { createCommand } from './command/index.js'
export type { Command, CommandContext, CommandOption } from './command/index.js'
