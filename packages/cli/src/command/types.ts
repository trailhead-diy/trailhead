import type { Result, CoreError } from '@trailhead/core'
import type { Logger } from '../utils/logger.js'
import type { CommandDef, ParsedArgs } from 'citty'

// Simple FileSystem interface for CLI context
interface FileSystem {
  readFile: (path: string) => Promise<Result<string, CoreError>>
  writeFile: (path: string, content: string) => Promise<Result<void, CoreError>>
  exists: (path: string) => Promise<Result<boolean, CoreError>>
  [key: string]: any // Allow additional fs methods
}

/**
 * Context object provided to command actions during execution
 *
 * Contains all the runtime context needed for command execution including
 * project information, logging utilities, filesystem access, and parsed arguments.
 */
export interface CommandContext {
  /** Absolute path to the project root directory */
  readonly projectRoot: string
  /** Logger instance for command output */
  readonly logger: Logger
  /** Whether verbose logging is enabled */
  readonly verbose: boolean
  /** Filesystem abstraction for file operations */
  readonly fs: FileSystem
  /** Parsed command arguments from citty */
  readonly args: ParsedArgs
}

/**
 * Command action function that uses Result types
 * Receives parsed args and context, returns Result<void, CoreError>
 */
export type CommandAction = (
  args: ParsedArgs,
  context: CommandContext
) => Promise<Result<void, CoreError>>

/**
 * Extended command definition that includes trailhead context
 * Wraps citty's CommandDef with our CommandAction pattern
 */
export interface TrailheadCommandDef extends Omit<CommandDef, 'run'> {
  /** Command action using trailhead Result types */
  run: CommandAction
}

/**
 * Re-export citty types for convenience
 */
export type { CommandDef, ParsedArgs, CommandContext as CittyContext, ArgsDef } from 'citty'

/**
 * Phase definition for multi-phase command execution
 *
 * Represents a single phase in a multi-step command execution process.
 * Each phase receives data from the previous phase and can transform it.
 *
 * Used for multi-step file transformation workflows (validate → prepare → execute).
 *
 * @template T - Type of data passed between phases
 */
export interface CommandPhase<T> {
  /** Human-readable name of the phase for logging */
  name: string
  /** Function that executes the phase logic */
  execute: (data: T, context: CommandContext) => Promise<Result<T, CoreError>>
}

/**
 * Options for interactive command behavior
 *
 * Configuration for commands that support interactive mode with user prompts.
 */
export interface InteractiveOptions {
  /** Whether to run in interactive mode with prompts */
  interactive?: boolean
}
